/**
 * Main Cloudflare Workers Handler
 * Routes incoming webhook updates and orchestrates the bot logic
 */

import { TelegramAPI } from "./telegram.js";
import { SecurityManager } from "./security.js";
import { DatabaseManager } from "./db.js";
import { KVSessionManager } from "./kv.js";
import { AdminWorkflow } from "./admin.js";
import { UserWorkflow } from "./user.js";
import { parseCallbackData } from "./utils.js";

/**
 * Main fetch handler for Cloudflare Workers
 */
export default {
  async fetch(request, env, ctx) {
    // Only accept POST requests
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    try {
      const update = await request.json();

      // Process update asynchronously
      ctx.waitUntil(processUpdate(update, env));

      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("[Handler] Failed to process request:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};

/**
 * Process Telegram update
 */
async function processUpdate(update, env) {
  try {
    // Initialize services
    const telegramAPI = new TelegramAPI(env.BOT_TOKEN);
    const security = new SecurityManager(
      telegramAPI,
      env.DB_KV,
      parseInt(env.DATABASE_CHANNEL_ID),
      parseInt(env.ADMIN_CACHE_TTL || 3600),
    );
    const dbManager = new DatabaseManager(env.DB_D1);
    const kvManager = new KVSessionManager(env.DB_KV);
    const adminWorkflow = new AdminWorkflow(telegramAPI, dbManager, kvManager);
    const userWorkflow = new UserWorkflow(telegramAPI, dbManager, kvManager);

    // Handle message updates
    if (update.message) {
      await handleMessage(
        update.message,
        telegramAPI,
        security,
        kvManager,
        adminWorkflow,
        userWorkflow,
        env,
      );
    }

    // Handle callback queries
    if (update.callback_query) {
      await handleCallbackQuery(
        update.callback_query,
        telegramAPI,
        security,
        userWorkflow,
        adminWorkflow,
      );
    }
  } catch (error) {
    console.error("[processUpdate] Unhandled error:", error);
  }
}

/**
 * Handle incoming messages
 */
async function handleMessage(
  message,
  telegramAPI,
  security,
  kvManager,
  adminWorkflow,
  userWorkflow,
  env,
) {
  const userId = message.from.id;
  const chatId = message.chat.id;
  const text = message.text?.trim() || "";
  const photo = message.photo;
  const video = message.video;
  const messageId = message.message_id;

  console.log(`[Handler] Message from user ${userId}: ${text}`);

  // Handle /start command
  if (text === "/start" || text.startsWith("/start ")) {
    const startParam = text.substring(7).trim();

    if (startParam.startsWith("movie_")) {
      // User clicking movie link - no admin check needed
      await userWorkflow.handleStartWithMovie(userId, chatId, startParam);
    } else {
      // Generic start
      await userWorkflow.handleStartGeneric(userId, chatId);
    }
    return;
  }

  // All other commands require admin verification
  const isAdmin = await security.verifyAdmin(userId);

  if (!isAdmin) {
    console.warn(`[Handler] Unauthorized attempt by user ${userId}: ${text}`);
    // Silently ignore non-admin messages
    return;
  }

  // Get current state
  const state = await kvManager.getState(userId);

  // Handle /newmovie command
  if (text === "/newmovie") {
    await adminWorkflow.handleNewMovieCommand(userId, chatId);
    return;
  }

  // Handle /panel command (open admin panel)
  if (text === "/panel") {
    await adminWorkflow.adminPanel.showAdminPanel(userId, chatId);
    return;
  }

  // Handle /finish command
  if (text === "/finish") {
    await adminWorkflow.handleFinishCommand(
      userId,
      chatId,
      env.BOT_USERNAME,
      parseInt(env.MAIN_CHANNEL_ID),
    );
    return;
  }

  // Handle state-based input
  if (state === "AWAITING_TITLE" && text && !text.startsWith("/")) {
    await adminWorkflow.handleTitleInput(userId, chatId, text);
    return;
  }

  if (state === "AWAITING_BANNER" && photo) {
    await adminWorkflow.handleBannerPhoto(userId, chatId, photo);
    return;
  }

  if (state === "AWAITING_VIDEOS" && video) {
    await adminWorkflow.handleVideoUpload(userId, chatId, video, messageId);
    return;
  }

  // Unknown command or invalid state
  if (text.startsWith("/")) {
    await telegramAPI.sendMessage(
      chatId,
      `<b>Unknown command:</b> <code>${text}</code>\n\n📋 Available commands:\n• /newmovie - Upload a new movie\n• /finish - Complete movie upload`,
      { parse_mode: "HTML" },
    );
  }
}

/**
 * Handle callback queries
 */
async function handleCallbackQuery(
  callbackQuery,
  telegramAPI,
  security,
  userWorkflow,
  adminWorkflow,
) {
  const userId = callbackQuery.from.id;
  const chatId = callbackQuery.message.chat.id;
  const callbackQueryId = callbackQuery.id;
  const messageId = callbackQuery.message?.message_id;
  const data = callbackQuery.data;
  const parsed = parseCallbackData(data);

  console.log(`[Handler] Callback from user ${userId}: ${data}`);

  try {
    // Language selection (for users)
    if (parsed?.action === "lang") {
      await userWorkflow.handleLanguageSelection(
        userId,
        chatId,
        callbackQueryId,
        parsed.language,
      );
      return;
    }

    // Admin panel callbacks
    if (parsed?.action === "admin") {
      const isAdmin = await security.verifyAdmin(userId);
      if (!isAdmin) {
        await telegramAPI.answerCallbackQuery(callbackQueryId, {
          text: "❌ Unauthorized",
          show_alert: true,
        });
        return;
      }

      // Route admin panel callbacks
      const subaction = parsed.subaction;

      if (subaction === "panel_menu") {
        await adminWorkflow.adminPanel.showAdminPanel(userId, chatId);
      } else if (subaction === "edit_template") {
        await adminWorkflow.adminPanel.showTemplateEditor(
          userId,
          chatId,
          callbackQueryId,
          messageId,
        );
      } else if (subaction === "view_current_template") {
        await adminWorkflow.adminPanel.showTemplatePreview(
          userId,
          chatId,
          callbackQueryId,
          messageId,
        );
      } else if (subaction === "reset_template") {
        await adminWorkflow.adminPanel.resetTemplate(
          userId,
          chatId,
          callbackQueryId,
          messageId,
        );
      } else if (subaction === "settings") {
        await adminWorkflow.adminPanel.showSettings(
          userId,
          chatId,
          callbackQueryId,
          messageId,
        );
      } else if (subaction === "button_language_menu") {
        await adminWorkflow.adminPanel.showButtonLanguageMenu(
          userId,
          chatId,
          callbackQueryId,
          messageId,
        );
      } else if (subaction.startsWith("set_button_lang_")) {
        const language = subaction.replace("set_button_lang_", "");
        await adminWorkflow.adminPanel.setButtonLanguage(
          userId,
          chatId,
          callbackQueryId,
          language,
          messageId,
        );
      } else if (subaction === "pending_posts") {
        await adminWorkflow.adminPanel.showPendingPosts(
          userId,
          chatId,
          callbackQueryId,
          messageId,
        );
      } else if (subaction.startsWith("approve_post_")) {
        const postId = parseInt(subaction.replace("approve_post_", ""));
        await adminWorkflow.adminPanel.approveAndPublishPost(
          userId,
          chatId,
          callbackQueryId,
          postId,
          messageId,
        );
      } else if (subaction.startsWith("reject_post_")) {
        const postId = parseInt(subaction.replace("reject_post_", ""));
        await adminWorkflow.adminPanel.rejectPost(
          userId,
          chatId,
          callbackQueryId,
          postId,
          messageId,
        );
      } else if (subaction.startsWith("preview_post_")) {
        const postId = parseInt(subaction.replace("preview_post_", ""));
        const post = await adminWorkflow.db.getPendingPost(postId);
        if (post) {
          await adminWorkflow.adminPanel.showPostApprovalDialog(
            userId,
            chatId,
            callbackQueryId,
            messageId,
            post,
          );
        }
      }
      return;
    }

    // Finish workflow callbacks (approval during finalization)
    if (parsed?.action === "finish") {
      const isAdmin = await security.verifyAdmin(userId);
      if (!isAdmin) {
        await telegramAPI.answerCallbackQuery(callbackQueryId, {
          text: "❌ Unauthorized",
          show_alert: true,
        });
        return;
      }

      const subaction = parsed.subaction;

      if (subaction.startsWith("approve_")) {
        const postId = parseInt(subaction.replace("approve_", ""));
        await adminWorkflow.adminPanel.approveAndPublishPost(
          userId,
          chatId,
          callbackQueryId,
          postId,
        );
      } else if (subaction.startsWith("edit_caption_")) {
        // TODO: Implement caption editing flow
        await telegramAPI.answerCallbackQuery(callbackQueryId, {
          text: "Edit caption feature coming soon",
          show_alert: false,
        });
      }
      return;
    }

    // Default to quality selection for download buttons
    await userWorkflow.handleQualitySelection(
      userId,
      chatId,
      callbackQueryId,
      data,
    );
  } catch (error) {
    console.error("[Handler] Failed to handle callback query:", error);
    await telegramAPI.answerCallbackQuery(callbackQueryId, {
      text: "❌ An error occurred. Please try again.",
      show_alert: true,
    });
  }
}
