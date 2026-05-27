/**
 * Advanced Admin Panel Module
 * Manages post-template, approval workflow, and admin settings with Inline Keyboards
 */

import { t } from "./i18n.js";
import { renderTemplate, escapeHtml, logAction } from "./utils.js";

export class AdminPanel {
  constructor(telegramAPI, dbManager, kvManager) {
    this.telegramAPI = telegramAPI;
    this.db = dbManager;
    this.kv = kvManager;
  }

  /**
   * Get admin's template (with fallback to default)
   */
  async getTemplate(userId) {
    try {
      const template = await this.db.getAdminTemplate(userId);
      return template || this.getDefaultTemplate();
    } catch (error) {
      console.error("[AdminPanel] Failed to get template:", error);
      return this.getDefaultTemplate();
    }
  }

  /**
   * Default post template
   */
  getDefaultTemplate() {
    return `<b>{title}</b>

📽️ <b>Max Quality:</b> {max_quality}p

{qualities_list}

👇 <i>Click below to watch in your preferred quality</i>`;
  }

  /**
   * Show admin panel main menu
   */
  async showAdminPanel(userId, chatId) {
    logAction("ADMIN_PANEL_MAIN", userId);

    try {
      const adminLanguage = await this.db.getUserLanguage(userId);

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: "📝 Edit Template",
              callback_data: "admin_edit_template",
            },
            {
              text: "⚙️ Settings",
              callback_data: "admin_settings",
            },
          ],
          [
            {
              text: "📋 Pending Posts",
              callback_data: "admin_pending_posts",
            },
          ],
        ],
      };

      await this.telegramAPI.sendMessage(
        chatId,
        t("admin_panel_menu", adminLanguage || "en"),
        {
          parse_mode: "HTML",
          reply_markup: keyboard,
        },
      );

      console.log(`[AdminPanel] Main menu shown to user ${userId}`);
    } catch (error) {
      console.error("[AdminPanel] Failed to show main menu:", error);
    }
  }

  async updateOrSendText(chatId, messageId, text, options = {}) {
    if (messageId) {
      try {
        return await this.telegramAPI.editMessageText(
          chatId,
          messageId,
          text,
          options,
        );
      } catch (error) {
        console.warn(
          "[AdminPanel] editMessageText failed, falling back to sendMessage:",
          error,
        );
      }
    }

    return await this.telegramAPI.sendMessage(chatId, text, options);
  }

  /**
   * Show template editor
   */
  async showTemplateEditor(userId, chatId, callbackQueryId, messageId) {
    logAction("ADMIN_EDIT_TEMPLATE", userId);

    try {
      const adminLanguage = await this.db.getUserLanguage(userId);
      const currentTemplate = await this.getTemplate(userId);

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: "📋 View Current",
              callback_data: "admin_view_current_template",
            },
          ],
          [
            {
              text: "✏️ Reset to Default",
              callback_data: "admin_reset_template",
            },
            {
              text: "🔄 Custom Template",
              callback_data: "admin_custom_template",
            },
          ],
          [
            {
              text: "← Back",
              callback_data: "admin_panel_menu",
            },
          ],
        ],
      };

      await this.telegramAPI.answerCallbackQuery(callbackQueryId, {
        text: "Template Editor",
        show_alert: false,
      });

      await this.updateOrSendText(
        chatId,
        messageId,
        t("admin_template_editor", adminLanguage || "en"),
        {
          parse_mode: "HTML",
          reply_markup: keyboard,
        },
      );

      console.log(`[AdminPanel] Template editor shown to user ${userId}`);
    } catch (error) {
      console.error("[AdminPanel] Failed to show template editor:", error);
      await this.telegramAPI.answerCallbackQuery(callbackQueryId, {
        text: "❌ Error loading template editor",
        show_alert: true,
      });
    }
  }

  /**
   * Show current template preview
   */
  async showTemplatePreview(userId, chatId, callbackQueryId, messageId) {
    logAction("ADMIN_VIEW_CURRENT_TEMPLATE", userId);

    try {
      const template = await this.getTemplate(userId);

      // Create sample render
      const sampleData = {
        title: "Sample Movie Title",
        max_quality: 1080,
        qualities_list: "🎬 Available in: 1080p, 720p, 480p",
      };

      const renderedPreview = renderTemplate(template, sampleData);

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: "← Back to Editor",
              callback_data: "admin_edit_template",
            },
          ],
        ],
      };

      await this.telegramAPI.answerCallbackQuery(callbackQueryId, {
        text: "Template Preview",
        show_alert: false,
      });

      const message = `<b>📋 Current Template Preview:</b>\n\n${escapeHtml(template)}\n\n<b>📸 Sample Render:</b>\n${renderedPreview}`;

      await this.updateOrSendText(chatId, messageId, message, {
        parse_mode: "HTML",
        reply_markup: keyboard,
      });

      console.log(`[AdminPanel] Template preview shown to user ${userId}`);
    } catch (error) {
      console.error("[AdminPanel] Failed to show template preview:", error);
      await this.telegramAPI.answerCallbackQuery(callbackQueryId, {
        text: "❌ Error loading template preview",
        show_alert: true,
      });
    }
  }

  /**
   * Reset template to default
   */
  async resetTemplate(userId, chatId, callbackQueryId, messageId) {
    logAction("ADMIN_RESET_TEMPLATE", userId);

    try {
      const defaultTemplate = this.getDefaultTemplate();
      await this.db.saveAdminTemplate(userId, defaultTemplate);

      await this.telegramAPI.answerCallbackQuery(callbackQueryId, {
        text: "✅ Template reset to default",
        show_alert: false,
      });

      await this.showTemplateEditor(userId, chatId, callbackQueryId, messageId);
      console.log(`[AdminPanel] Template reset to default for user ${userId}`);
    } catch (error) {
      console.error("[AdminPanel] Failed to reset template:", error);
      await this.telegramAPI.answerCallbackQuery(callbackQueryId, {
        text: "❌ Failed to reset template",
        show_alert: true,
      });
    }
  }

  /**
   * Show settings menu
   */
  async showSettings(userId, chatId, callbackQueryId, messageId) {
    logAction("ADMIN_SETTINGS", userId);

    try {
      const buttonLanguage = await this.db.getAdminButtonLanguage(userId);
      const currentLang = buttonLanguage || "fa";

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: `🌐 Button Language: ${currentLang.toUpperCase()}`,
              callback_data: "admin_button_language_menu",
            },
          ],
          [
            {
              text: "← Back to Menu",
              callback_data: "admin_panel_menu",
            },
          ],
        ],
      };

      await this.telegramAPI.answerCallbackQuery(callbackQueryId, {
        text: "Settings",
        show_alert: false,
      });

      await this.updateOrSendText(
        chatId,
        messageId,
        t("admin_settings_menu", "en"),
        {
          parse_mode: "HTML",
          reply_markup: keyboard,
        },
      );

      console.log(`[AdminPanel] Settings menu shown to user ${userId}`);
    } catch (error) {
      console.error("[AdminPanel] Failed to show settings:", error);
      await this.telegramAPI.answerCallbackQuery(callbackQueryId, {
        text: "❌ Error loading settings",
        show_alert: true,
      });
    }
  }

  /**
   * Show button language selection
   */
  async showButtonLanguageMenu(userId, chatId, callbackQueryId, messageId) {
    logAction("ADMIN_BUTTON_LANGUAGE_MENU", userId);

    try {
      const keyboard = {
        inline_keyboard: [
          [
            {
              text: "🇮🇷 فارسی (Persian)",
              callback_data: "admin_set_button_lang_fa",
            },
          ],
          [
            {
              text: "🇬🇧 English",
              callback_data: "admin_set_button_lang_en",
            },
          ],
          [
            {
              text: "🇸🇦 العربية (Arabic)",
              callback_data: "admin_set_button_lang_ar",
            },
          ],
          [
            {
              text: "← Back to Settings",
              callback_data: "admin_settings",
            },
          ],
        ],
      };

      await this.telegramAPI.answerCallbackQuery(callbackQueryId, {
        text: "Select Button Language",
        show_alert: false,
      });

      await this.updateOrSendText(
        chatId,
        messageId,
        "<b>🌐 Select Language for Channel Buttons:</b>",
        {
          parse_mode: "HTML",
          reply_markup: keyboard,
        },
      );

      console.log(`[AdminPanel] Button language menu shown to user ${userId}`);
    } catch (error) {
      console.error("[AdminPanel] Failed to show button language menu:", error);
      await this.telegramAPI.answerCallbackQuery(callbackQueryId, {
        text: "❌ Error loading language menu",
        show_alert: true,
      });
    }
  }

  /**
   * Set button language
   */
  async setButtonLanguage(
    userId,
    chatId,
    callbackQueryId,
    language,
    messageId,
  ) {
    logAction("ADMIN_SET_BUTTON_LANGUAGE", userId, { language });

    try {
      await this.db.saveAdminButtonLanguage(userId, language);

      await this.telegramAPI.answerCallbackQuery(callbackQueryId, {
        text: `✅ Button language set to ${language.toUpperCase()}`,
        show_alert: false,
      });

      await this.showSettings(userId, chatId, callbackQueryId, messageId);
      console.log(
        `[AdminPanel] Button language set to ${language} for user ${userId}`,
      );
    } catch (error) {
      console.error("[AdminPanel] Failed to set button language:", error);
      await this.telegramAPI.answerCallbackQuery(callbackQueryId, {
        text: "❌ Failed to set button language",
        show_alert: true,
      });
    }
  }

  /**
   * Show pending posts for approval
   */
  async showPendingPosts(userId, chatId, callbackQueryId, messageId) {
    logAction("ADMIN_PENDING_POSTS", userId);

    try {
      const adminLanguage = await this.db.getUserLanguage(userId);
      const pendingPosts = await this.db.getPendingPostsByAdmin(userId);

      if (!pendingPosts || pendingPosts.length === 0) {
        await this.telegramAPI.answerCallbackQuery(callbackQueryId, {
          text: "No pending posts",
          show_alert: false,
        });

        const keyboard = {
          inline_keyboard: [
            [
              {
                text: "← Back to Menu",
                callback_data: "admin_panel_menu",
              },
            ],
          ],
        };

        await this.updateOrSendText(
          chatId,
          messageId,
          "<b>📋 Pending Posts:</b>\n\n✅ No pending posts for approval",
          {
            parse_mode: "HTML",
            reply_markup: keyboard,
          },
        );
        return;
      }

      // Show first pending post
      const post = pendingPosts[0];
      await this.showPostApprovalDialog(
        userId,
        chatId,
        callbackQueryId,
        messageId,
        post,
      );

      console.log(
        `[AdminPanel] Pending posts shown to user ${userId}: ${pendingPosts.length} post(s)`,
      );
    } catch (error) {
      console.error("[AdminPanel] Failed to show pending posts:", error);
      await this.telegramAPI.answerCallbackQuery(callbackQueryId, {
        text: "❌ Error loading pending posts",
        show_alert: true,
      });
    }
  }

  /**
   * Show post approval dialog
   */
  async showPostApprovalDialog(
    userId,
    chatId,
    callbackQueryId,
    messageId,
    post,
  ) {
    try {
      const movie = await this.db.getMovie(post.movie_id);

      if (!movie) {
        throw new Error(`Movie ${post.movie_id} not found`);
      }

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: "✅ Approve & Publish",
              callback_data: `admin_approve_post_${post.id}`,
            },
          ],
          [
            {
              text: "❌ Reject",
              callback_data: `admin_reject_post_${post.id}`,
            },
            {
              text: "👁️ Preview",
              callback_data: `admin_preview_post_${post.id}`,
            },
          ],
          [
            {
              text: "← Back to Posts",
              callback_data: "admin_pending_posts",
            },
          ],
        ],
      };

      const message = `<b>📋 Pending Post Approval</b>\n\n<b>Movie:</b> ${escapeHtml(movie.title)}\n<b>Status:</b> ${post.status}\n<b>Created:</b> ${post.created_at}\n\n<b>Caption Preview:</b>\n${post.caption}`;

      await this.updateOrSendText(chatId, messageId, message, {
        parse_mode: "HTML",
        reply_markup: keyboard,
      });
    } catch (error) {
      console.error("[AdminPanel] Failed to show approval dialog:", error);
      await this.telegramAPI.answerCallbackQuery(callbackQueryId, {
        text: "❌ Error loading post",
        show_alert: true,
      });
    }
  }

  /**
   * Approve and publish pending post to Main Channel
   */
  async approveAndPublishPost(
    userId,
    chatId,
    callbackQueryId,
    postId,
    messageId,
  ) {
    logAction("ADMIN_APPROVE_POST", userId, { postId });

    try {
      const post = await this.db.getPendingPost(postId);

      if (!post) {
        throw new Error(`Pending post ${postId} not found`);
      }

      const movie = await this.db.getMovie(post.movie_id);
      if (!movie) {
        throw new Error(`Movie ${post.movie_id} not found`);
      }

      // Mark post as approved in database
      await this.db.updatePendingPostStatus(postId, "approved");

      // Publish to main channel with quality buttons
      await this.publishMovieToChannel(
        movie,
        parseInt(process.env.MAIN_CHANNEL_ID || 0),
        post.caption,
        userId,
      );

      await this.telegramAPI.answerCallbackQuery(callbackQueryId, {
        text: "✅ Post approved and published!",
        show_alert: false,
      });

      await this.showPendingPosts(userId, chatId, callbackQueryId, messageId);
      console.log(`[AdminPanel] Post ${postId} approved and published`);
    } catch (error) {
      console.error("[AdminPanel] Failed to approve post:", error);
      await this.telegramAPI.answerCallbackQuery(callbackQueryId, {
        text: "❌ Failed to approve post",
        show_alert: true,
      });
    }
  }

  /**
   * Reject pending post
   */
  async rejectPost(userId, chatId, callbackQueryId, postId, messageId) {
    logAction("ADMIN_REJECT_POST", userId, { postId });

    try {
      await this.db.updatePendingPostStatus(postId, "rejected");

      await this.telegramAPI.answerCallbackQuery(callbackQueryId, {
        text: "❌ Post rejected",
        show_alert: false,
      });

      await this.showPendingPosts(userId, chatId, callbackQueryId, messageId);
      console.log(`[AdminPanel] Post ${postId} rejected`);
    } catch (error) {
      console.error("[AdminPanel] Failed to reject post:", error);
      await this.telegramAPI.answerCallbackQuery(callbackQueryId, {
        text: "❌ Failed to reject post",
        show_alert: true,
      });
    }
  }

  /**
   * Publish movie to main channel with quality buttons
   */
  async publishMovieToChannel(movie, mainChannelId, caption, adminId) {
    try {
      const buttonLanguage = await this.db.getAdminButtonLanguage(adminId);
      const videos = await this.db.getMovieVideos(movie.id);

      // Get unique qualities sorted descending
      const qualities = [...new Set(videos.map((v) => v.quality))].sort(
        (a, b) => b - a,
      );

      // Create quality buttons
      const keyboard = {
        inline_keyboard: qualities.map((quality) => [
          {
            text: t("quality_button", buttonLanguage || "fa", { quality }),
            callback_data: `download_${movie.id}_${quality}`,
          },
        ]),
      };

      // Send banner with caption and buttons
      const result = await this.telegramAPI.sendPhoto(
        mainChannelId,
        movie.banner_file_id,
        {
          caption,
          parse_mode: "HTML",
          reply_markup: keyboard,
        },
      );

      console.log(`[AdminPanel] Movie published to channel: ${movie.title}`);
      return result;
    } catch (error) {
      console.error("[AdminPanel] Failed to publish movie to channel:", error);
      throw error;
    }
  }
}
