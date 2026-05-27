/**
 * Post Processor Module
 * Handles rendering templates, creating captions with buttons,
 * and managing the approval workflow
 */

import { renderTemplate, escapeHtml, logAction } from "./utils.js";
import { t } from "./i18n.js";

export class PostProcessor {
  constructor(telegramAPI, dbManager, adminPanel) {
    this.telegramAPI = telegramAPI;
    this.db = dbManager;
    this.adminPanel = adminPanel;
  }

  /**
   * Generate caption from template with dynamic data
   */
  async generateCaption(adminId, movie, qualities) {
    try {
      const template = await this.adminPanel.getTemplate(adminId);

      // Prepare dynamic data
      const qualitiesList = qualities
        .sort((a, b) => b - a)
        .map((q) => `🎬 ${q}p`)
        .join("\n");

      const templateData = {
        title: movie.title,
        max_quality: movie.max_quality,
        qualities_list: qualitiesList,
      };

      const caption = renderTemplate(template, templateData);
      return caption;
    } catch (error) {
      console.error("[PostProcessor] Failed to generate caption:", error);
      throw error;
    }
  }

  /**
   * Create pending post (awaiting admin approval)
   */
  async createPendingPost(movieId, adminId, caption) {
    logAction("CREATE_PENDING_POST", adminId, { movieId });

    try {
      const postId = await this.db.createPendingPost(movieId, adminId, caption);

      console.log(
        `[PostProcessor] Pending post created: ${postId} for movie ${movieId}`,
      );

      return postId;
    } catch (error) {
      console.error("[PostProcessor] Failed to create pending post:", error);
      throw error;
    }
  }

  /**
   * Show preview of pending post to admin for approval
   */
  async showPostPreview(
    movieId,
    adminId,
    chatId,
    caption,
    bannerFileId,
    qualities,
    postId,
  ) {
    logAction("SHOW_POST_PREVIEW", adminId, { movieId, postId });

    try {
      const buttonLanguage = await this.db.getAdminButtonLanguage(adminId);

      // Create quality buttons
      const keyboard = {
        inline_keyboard: qualities
          .sort((a, b) => b - a)
          .map((quality) => [
            {
              text: t("quality_button", buttonLanguage || "fa", { quality }),
              callback_data: `download_${movieId}_${quality}`,
            },
          ])
          .concat([
            [
              {
                text: "✅ Approve & Publish",
                callback_data: `finish_approve_${postId}`,
              },
              {
                text: "❌ Edit",
                callback_data: `finish_edit_caption_${postId}`,
              },
            ],
          ]),
      };

      // Send preview with banner and buttons
      const result = await this.telegramAPI.sendPhoto(chatId, bannerFileId, {
        caption,
        parse_mode: "HTML",
        reply_markup: keyboard,
      });

      console.log(
        `[PostProcessor] Preview shown to admin ${adminId} for post ${postId}`,
      );

      return result;
    } catch (error) {
      console.error("[PostProcessor] Failed to show preview:", error);
      throw error;
    }
  }

  /**
   * Update pending post caption
   */
  async updatePendingPostCaption(postId, newCaption) {
    logAction("UPDATE_PENDING_POST_CAPTION", postId);

    try {
      await this.db.updatePendingPostCaption(postId, newCaption);

      console.log(`[PostProcessor] Pending post ${postId} caption updated`);
    } catch (error) {
      console.error(
        "[PostProcessor] Failed to update pending post caption:",
        error,
      );
      throw error;
    }
  }

  /**
   * Generate quality buttons list as HTML
   */
  generateQualityButtonsList(qualities, language = "fa") {
    const buttons = qualities
      .sort((a, b) => b - a)
      .map((q) => {
        const label = t("quality_button", language, { quality: q });
        return `📺 ${label}`;
      });

    return buttons.join("\n");
  }

  /**
   * Validate caption template
   */
  validateTemplate(template) {
    try {
      // Check if template has required variables
      const requiredVars = ["title", "max_quality"];
      const missingVars = requiredVars.filter(
        (v) => !template.includes(`{${v}}`),
      );

      if (missingVars.length > 0) {
        throw new Error(
          `Template missing required variables: ${missingVars.join(", ")}`,
        );
      }

      // Try rendering with sample data
      const sampleData = {
        title: "Test",
        max_quality: 1080,
        qualities_list: "1080p, 720p",
      };

      renderTemplate(template, sampleData);
      return true;
    } catch (error) {
      console.error("[PostProcessor] Template validation failed:", error);
      throw error;
    }
  }
}
