/**
 * User Workflow Handler
 * Manages deep link downloads and video delivery
 */

import {
  parseStartParam,
  parseCallbackData,
  createQualityKeyboard,
  getQualityLabel,
  escapeHtml,
  logAction,
  formatMovieMessage,
} from "./utils.js";
import { t, getLanguageKeyboard } from "./i18n.js";

export class UserWorkflow {
  constructor(telegramAPI, dbManager, kvManager) {
    this.telegramAPI = telegramAPI;
    this.db = dbManager;
    this.kv = kvManager;
  }

  /**
   * Get user's language (with fallback: KV cache → D1 → prompt)
   */
  async getUserLanguage(userId) {
    // Try KV cache first
    let language = await this.kv.getUserLanguage(userId);
    if (language) {
      return language;
    }

    // Try D1 database
    language = await this.db.getUserLanguage(userId);
    if (language) {
      // Update KV cache
      await this.kv.setUserLanguage(userId, language);
      return language;
    }

    // Default to English if not set
    return "en";
  }

  /**
   * Set user's language preference
   */
  async setUserLanguage(userId, language) {
    // Save to both KV and D1
    await this.kv.setUserLanguage(userId, language);
    await this.db.setUserLanguage(userId, language);
    console.log(`[UserWorkflow] Language set for user ${userId}: ${language}`);
  }

  /**
   * Handle language selection callback
   */
  async handleLanguageSelection(userId, chatId, callbackQueryId, language) {
    logAction("CALLBACK_LANGUAGE_SELECT", userId, { language });

    try {
      // Save language preference
      await this.setUserLanguage(userId, language);

      // Answer callback with success message
      const successMsg = t("lang_selected", language);
      await this.telegramAPI.answerCallbackQuery(callbackQueryId, {
        text: successMsg,
        show_alert: false,
      });

      // Check if there was a pending movie link
      const state = await this.kv.getState(userId);
      if (state && state.startsWith("PENDING_MOVIE_")) {
        const movieId = state.replace("PENDING_MOVIE_", "");
        await this.kv.deleteState(userId);
        await this.handleStartWithMovie(userId, chatId, `movie_${movieId}`);
      } else {
        // Generic welcome
        const welcomeMsg = t("user_welcome", language);
        await this.telegramAPI.sendMessage(chatId, welcomeMsg);
      }

      console.log(
        `[UserWorkflow] Language selected for user ${userId}: ${language}`,
      );
    } catch (error) {
      console.error(
        "[UserWorkflow] Failed to handle language selection:",
        error,
      );
      await this.telegramAPI.answerCallbackQuery(callbackQueryId, {
        text: "❌ Failed to set language. Please try again.",
        show_alert: true,
      });
    }
  }

  /**
   * Handle /start with movie deep link
   */
  async handleStartWithMovie(userId, chatId, startParam) {
    logAction("START_WITH_MOVIE", userId, { param: startParam });

    try {
      // Get user's language
      const userLanguage = await this.getUserLanguage(userId);

      // Check if user has language selected (if not, show selector)
      const hasLanguage = await this.db.hasUserLanguage(userId);
      if (!hasLanguage) {
        const movieId = parseStartParam(startParam);
        if (movieId) {
          // Store intent to resume after lang selection
          await this.kv.setState(userId, `PENDING_MOVIE_${movieId}`);
        }

        await this.telegramAPI.sendMessage(
          chatId,
          t("lang_select_prompt", "en"),
          { reply_markup: getLanguageKeyboard() },
        );
        return;
      }

      const movieId = parseStartParam(startParam);

      if (!movieId) {
        await this.telegramAPI.sendMessage(
          chatId,
          t("user_invalid_link", userLanguage),
        );
        return;
      }

      // Fetch movie from D1
      const movie = await this.db.getMovie(movieId);

      if (!movie) {
        await this.telegramAPI.sendMessage(
          chatId,
          t("user_movie_not_found", userLanguage),
        );
        return;
      }

      // Fetch available videos
      const videos = await this.db.getMovieVideos(movieId);

      if (videos.length === 0) {
        await this.telegramAPI.sendMessage(
          chatId,
          t("user_no_videos", userLanguage),
        );
        return;
      }

      // Extract unique qualities and sort DESC
      const qualities = [...new Set(videos.map((v) => v.quality))].sort(
        (a, b) => b - a,
      );

      // Send banner with quality options (localized)
      const qualitiesText = qualities
        .map((q) => `• ${getQualityLabel(q, userLanguage)}`)
        .join("\n");

      const caption = t("user_quality_available", userLanguage, {
        title: escapeHtml(movie.title),
        qualities: qualitiesText,
      });

      await this.telegramAPI.sendPhoto(chatId, movie.banner_file_id, {
        caption,
        reply_markup: createQualityKeyboard(movieId, qualities, userLanguage),
      });

      console.log(
        `[UserWorkflow] Sent movie ${movieId} to user ${userId} (${userLanguage}) with qualities: ${qualities.join(", ")}`,
      );
    } catch (error) {
      console.error("[UserWorkflow] Failed to handle start with movie:", error);
      const userLanguage = await this.getUserLanguage(userId);
      await this.telegramAPI.sendMessage(
        chatId,
        t("user_movie_not_found", userLanguage),
      );
    }
  }

  /**
   * Handle quality selection callback query
   */
  async handleQualitySelection(userId, chatId, callbackQueryId, callbackData) {
    logAction("CALLBACK_QUALITY_SELECT", userId, {
      data: callbackData,
    });

    try {
      const userLanguage = await this.getUserLanguage(userId);
      const parsed = parseCallbackData(callbackData);

      if (!parsed || parsed.action !== "download") {
        await this.telegramAPI.answerCallbackQuery(callbackQueryId, {
          text: "❌ Invalid callback data.",
          show_alert: false,
        });
        return;
      }

      const { movieId, quality } = parsed;

      // Fetch movie
      const movie = await this.db.getMovie(movieId);

      if (!movie) {
        await this.telegramAPI.answerCallbackQuery(callbackQueryId, {
          text: t("user_movie_not_found", userLanguage),
          show_alert: true,
        });
        return;
      }

      // Fetch video by quality
      const video = await this.db.getVideoByQuality(movieId, quality);

      if (!video) {
        await this.telegramAPI.answerCallbackQuery(callbackQueryId, {
          text: t("user_quality_not_found", userLanguage, { quality }),
          show_alert: true,
        });
        return;
      }

      // Answer callback query with loading indicator
      await this.telegramAPI.answerCallbackQuery(callbackQueryId, {
        text: t("user_sending_video", userLanguage),
        show_alert: false,
      });

      // Send video to user using cached file ID (no re-upload)
      const videoCaption = t("user_video_caption", userLanguage, {
        title: escapeHtml(movie.title),
        quality: getQualityLabel(quality, userLanguage),
      });

      await this.telegramAPI.sendVideo(chatId, video.telegram_file_id, {
        caption: videoCaption,
        parse_mode: "HTML",
      });

      console.log(
        `[UserWorkflow] Delivered video to user ${userId} (${userLanguage}), movie ${movieId}, quality ${quality}`,
      );
    } catch (error) {
      console.error(
        "[UserWorkflow] Failed to handle quality selection:",
        error,
      );
      const userLanguage = await this.getUserLanguage(userId);
      await this.telegramAPI.answerCallbackQuery(callbackQueryId, {
        text: t("user_send_failed", userLanguage),
        show_alert: true,
      });
    }
  }

  /**
   * Handle generic /start (no movie specified)
   */
  async handleStartGeneric(userId, chatId) {
    logAction("START_GENERIC", userId);

    // Check if user has selected a language
    const hasLanguage = await this.db.hasUserLanguage(userId);

    if (!hasLanguage) {
      // Show language selection on first visit
      await this.telegramAPI.sendMessage(
        chatId,
        t("lang_select_prompt", "en"),
        { reply_markup: getLanguageKeyboard() },
      );
      return;
    }

    // Get user's language
    const userLanguage = await this.getUserLanguage(userId);

    // Send welcome message in user's language
    const message = t("user_welcome", userLanguage);
    await this.telegramAPI.sendMessage(chatId, message);
  }
}
