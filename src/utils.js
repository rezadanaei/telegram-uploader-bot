/**
 * Utility Functions
 * Helper functions for quality detection and data processing
 */

import { t } from "./i18n.js";

/**
 * Detect video quality based on resolution
 * Returns: 1080 (1920x1080+), 720 (1280x720), or 480 (default)
 */
export function detectQuality(width, height) {
  if (!width || !height) {
    console.warn(
      `[Utils] Missing dimensions: ${width}x${height}, defaulting to 480`,
    );
    return 480;
  }

  if (width >= 1920 && height >= 1080) {
    return 1080;
  }

  if (width >= 1280 && height >= 720) {
    return 720;
  }

  return 480;
}

/**
 * Create inline keyboard for quality options (localized)
 */
export function createQualityKeyboard(movieId, qualities, language = "en") {
  const buttons = qualities.map((quality) => [
    {
      text: t("quality_button", language, { quality }),
      callback_data: `download_${movieId}_${quality}`,
    },
  ]);

  return {
    inline_keyboard: buttons,
  };
}

/**
 * Create deep link for movie
 */
export function createDeepLink(botUsername, movieId) {
  return `https://t.me/${botUsername}?start=movie_${movieId}`;
}

/**
 * Parse start parameter to extract movie ID
 */
export function parseStartParam(param) {
  if (param && param.startsWith("movie_")) {
    const movieId = parseInt(param.substring(6));
    return isNaN(movieId) ? null : movieId;
  }
  return null;
}

/**
 * Parse callback data to extract action and parameters
 */
export function parseCallbackData(data) {
  const parts = data.split("_");

  if (parts[0] === "download" && parts.length === 3) {
    return {
      action: "download",
      movieId: parseInt(parts[1]),
      quality: parseInt(parts[2]),
    };
  }

  if (parts[0] === "lang" && parts.length === 2) {
    return {
      action: "lang",
      language: parts[1],
    };
  }

  return null;
}

/**
 * Format HTML message for banner post (localized)
 */
export function formatMovieMessage(title, maxQuality, language = "en") {
  const qualityLabel = getQualityLabel(maxQuality, language);
  return `
<b>${escapeHtml(title)}</b>

📽️ <b>${t("banner_quality_header", language)}</b>
• ${qualityLabel}

👇 <i>${t("banner_download_prompt", language)}</i>
  `.trim();
}

/**
 * Escape special characters for HTML
 */
export function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Validate Telegram file ID format (basic check)
 */
export function isValidFileId(fileId) {
  return typeof fileId === "string" && fileId.length > 10;
}

/**
 * Get quality label for display (localized)
 */
export function getQualityLabel(quality, language = "en") {
  const labelKey = {
    1080: "quality_label_1080",
    720: "quality_label_720",
    480: "quality_label_480",
  }[quality];

  return labelKey ? t(labelKey, language) : `${quality}p`;
}

/**
 * Log action with timestamp
 */
export function logAction(action, userId, details = {}) {
  const timestamp = new Date().toISOString();
  console.log(
    `[${timestamp}] [${action}] User: ${userId}`,
    JSON.stringify(details),
  );
}
