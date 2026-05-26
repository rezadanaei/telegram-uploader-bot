/**
 * Admin Workflow Handler
 * Manages /newmovie, state transitions, and /finish operations
 */

import {
  detectQuality,
  createDeepLink,
  formatMovieMessage,
  logAction,
  isValidFileId,
} from "./utils.js";
import { t } from "./i18n.js";

export class AdminWorkflow {
  constructor(telegramAPI, dbManager, kvManager) {
    this.telegramAPI = telegramAPI;
    this.db = dbManager;
    this.kv = kvManager;
  }

  /**
   * Get admin's language preference (default: Persian)
   */
  async getAdminLanguage(userId) {
    let language = await this.kv.getUserLanguage(userId);
    if (language) {
      return language;
    }

    language = await this.db.getUserLanguage(userId);
    if (language) {
      await this.kv.setUserLanguage(userId, language);
      return language;
    }

    // Default to Persian (fa) for admins
    return "fa";
  }

  /**
   * Set admin's language preference
   */
  async setAdminLanguage(userId, language) {
    await this.kv.setUserLanguage(userId, language);
    await this.db.setUserLanguage(userId, language);
    console.log(
      `[AdminWorkflow] Admin language set for user ${userId}: ${language}`,
    );
  }
  /**
   * Handle /newmovie command
   */
  async handleNewMovieCommand(userId, chatId) {
    logAction("COMMAND_NEWMOVIE", userId);

    try {
      const adminLanguage = await this.getAdminLanguage(userId);

      // Set state to AWAITING_TITLE
      await this.kv.setState(userId, "AWAITING_TITLE");

      // Send prompt
      await this.telegramAPI.sendMessage(
        chatId,
        t("admin_new_movie_title", adminLanguage),
        { parse_mode: "HTML" },
      );

      console.log(
        `[AdminWorkflow] Initiated movie upload for user ${userId} (${adminLanguage})`,
      );
    } catch (error) {
      console.error("[AdminWorkflow] Failed to handle /newmovie:", error);
      const adminLanguage = await this.getAdminLanguage(userId);
      await this.telegramAPI.sendMessage(
        chatId,
        t("admin_start_failed", adminLanguage),
      );
    }
  }

  /**
   * Handle text input during AWAITING_TITLE state
   */
  async handleTitleInput(userId, chatId, text) {
    logAction("STATE_AWAITING_TITLE", userId, { text });

    try {
      const adminLanguage = await this.getAdminLanguage(userId);

      // Validate title
      if (!text || text.trim().length < 2 || text.trim().length > 100) {
        await this.telegramAPI.sendMessage(
          chatId,
          t("admin_title_invalid", adminLanguage),
        );
        return;
      }

      const title = text.trim();

      // Save title to KV
      await this.kv.saveDraftTitle(userId, title);

      // Transition to AWAITING_BANNER
      await this.kv.setState(userId, "AWAITING_BANNER");

      await this.telegramAPI.sendMessage(
        chatId,
        t("admin_title_saved", adminLanguage, { title }),
        { parse_mode: "HTML" },
      );

      console.log(
        `[AdminWorkflow] Title saved for user ${userId} (${adminLanguage}): ${title}`,
      );
    } catch (error) {
      console.error("[AdminWorkflow] Failed to handle title input:", error);
      const adminLanguage = await this.getAdminLanguage(userId);
      await this.telegramAPI.sendMessage(
        chatId,
        t("admin_title_invalid", adminLanguage),
      );
    }
  }

  /**
   * Handle photo input during AWAITING_BANNER state
   */
  async handleBannerPhoto(userId, chatId, photo) {
    logAction("STATE_AWAITING_BANNER", userId, {
      photoCount: photo?.length,
    });

    try {
      const adminLanguage = await this.getAdminLanguage(userId);

      // Get highest resolution file ID
      if (!photo || photo.length === 0) {
        await this.telegramAPI.sendMessage(
          chatId,
          t("admin_photo_invalid", adminLanguage),
        );
        return;
      }

      const bannerFileId = photo[photo.length - 1].file_id;

      if (!isValidFileId(bannerFileId)) {
        throw new Error("Invalid banner file ID");
      }

      // Save banner to KV
      await this.kv.saveDraftBanner(userId, bannerFileId);

      // Transition to AWAITING_VIDEOS
      await this.kv.setState(userId, "AWAITING_VIDEOS");

      await this.telegramAPI.sendMessage(
        chatId,
        t("admin_banner_saved", adminLanguage),
        { parse_mode: "HTML" },
      );

      console.log(
        `[AdminWorkflow] Banner saved for user ${userId} (${adminLanguage})`,
      );
    } catch (error) {
      console.error("[AdminWorkflow] Failed to handle banner:", error);
      const adminLanguage = await this.getAdminLanguage(userId);
      await this.telegramAPI.sendMessage(
        chatId,
        t("admin_photo_invalid", adminLanguage),
      );
    }
  }

  /**
   * Handle video input during AWAITING_VIDEOS state
   */
  async handleVideoUpload(userId, chatId, video, messageId) {
    logAction("STATE_AWAITING_VIDEOS", userId, {
      videoQuality: video.width,
      messageId,
    });

    try {
      const adminLanguage = await this.getAdminLanguage(userId);

      if (!video || !video.file_id) {
        await this.telegramAPI.sendMessage(
          chatId,
          t("admin_invalid_video", adminLanguage),
        );
        return;
      }

      // Auto-detect quality based on resolution
      const quality = detectQuality(video.width, video.height);

      // Save video to KV
      const videoIndex = await this.kv.addDraftVideo(
        userId,
        quality,
        video.file_id,
        messageId,
      );

      await this.telegramAPI.sendMessage(
        chatId,
        t("admin_video_saved", adminLanguage, {
          index: videoIndex,
          quality,
        }),
        { parse_mode: "HTML" },
      );

      console.log(
        `[AdminWorkflow] Video ${videoIndex} saved for user ${userId} (${adminLanguage}), quality: ${quality}p`,
      );
    } catch (error) {
      console.error("[AdminWorkflow] Failed to handle video:", error);
      const adminLanguage = await this.getAdminLanguage(userId);
      await this.telegramAPI.sendMessage(
        chatId,
        t("admin_video_failed", adminLanguage),
      );
    }
  }

  /**
   * Handle /finish command - finalize movie and save to D1
   */
  async handleFinishCommand(userId, chatId, botUsername, mainChannelId) {
    logAction("COMMAND_FINISH", userId);

    try {
      const adminLanguage = await this.getAdminLanguage(userId);
      const state = await this.kv.getState(userId);

      if (state !== "AWAITING_VIDEOS") {
        await this.telegramAPI.sendMessage(
          chatId,
          t("admin_not_in_upload", adminLanguage),
        );
        return;
      }

      // Retrieve draft data
      const title = await this.kv.getDraftTitle(userId);
      const bannerFileId = await this.kv.getDraftBanner(userId);
      const videos = await this.kv.getDraftVideos(userId);

      if (!title || !bannerFileId || videos.length === 0) {
        await this.telegramAPI.sendMessage(
          chatId,
          t("admin_incomplete_draft", adminLanguage),
        );
        return;
      }

      // Calculate max quality
      const maxQuality = Math.max(...videos.map((v) => v.quality));

      // Create movie in D1
      const movieId = await this.db.createMovie(
        title,
        bannerFileId,
        maxQuality,
      );

      // Batch insert all video files
      const videoData = videos.map((v) => ({
        quality: v.quality,
        fileId: v.fileId,
        uniqueMsgId: v.uniqueMsgId,
      }));

      await this.db.batchInsertVideoFiles(movieId, videoData);

      // Create deep link
      const deepLink = createDeepLink(botUsername, movieId);

      // Send to MAIN_CHANNEL with inline keyboard
      const messageText = formatMovieMessage(title, maxQuality, adminLanguage);
      const keyboard = {
        inline_keyboard: [
          [
            {
              text: "📥 Download",
              url: deepLink,
            },
          ],
        ],
      };

      await this.telegramAPI.sendPhoto(mainChannelId, bannerFileId, {
        caption: messageText,
        reply_markup: keyboard,
      });

      // Clear KV draft data
      await this.kv.deleteState(userId);
      await this.kv.clearDraft(userId);

      // Confirm to admin
      await this.telegramAPI.sendMessage(
        chatId,
        t("admin_movie_complete", adminLanguage, {
          title,
          quality: maxQuality,
          count: videos.length,
          deepLink,
        }),
        { parse_mode: "HTML" },
      );

      console.log(
        `[AdminWorkflow] Movie completed for user ${userId} (${adminLanguage}), ID: ${movieId}`,
      );
    } catch (error) {
      console.error("[AdminWorkflow] Failed to finish movie:", error);
      const adminLanguage = await this.getAdminLanguage(userId);
      await this.telegramAPI.sendMessage(
        chatId,
        t("admin_upload_failed", adminLanguage, {
          error: error.message,
        }),
      );
    }
  }
}
