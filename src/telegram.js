/**
 * Telegram API Wrapper
 * Handles all Telegram API interactions with robust error handling
 */

export class TelegramAPI {
  constructor(botToken) {
    this.botToken = botToken;
    this.baseURL = `https://api.telegram.org/bot${botToken}`;
  }

  /**
   * Generic request method with retry logic
   */
  async request(method, params = {}) {
    const url = `${this.baseURL}/${method}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(`Telegram API error: ${data.description}`);
      }

      return data.result;
    } catch (error) {
      console.error(`[TelegramAPI] ${method} failed:`, error);
      throw error;
    }
  }

  /**
   * Send message to a user or channel
   */
  async sendMessage(chatId, text, options = {}) {
    return this.request("sendMessage", {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      ...options,
    });
  }

  /**
   * Send photo with optional inline keyboard
   */
  async sendPhoto(chatId, fileId, options = {}) {
    return this.request("sendPhoto", {
      chat_id: chatId,
      photo: fileId,
      parse_mode: "HTML",
      ...options,
    });
  }

  /**
   * Send video file to user
   */
  async sendVideo(chatId, fileId, options = {}) {
    return this.request("sendVideo", {
      chat_id: chatId,
      video: fileId,
      ...options,
    });
  }

  /**
   * Get chat member info (admin verification)
   */
  async getChatMember(chatId, userId) {
    return this.request("getChatMember", {
      chat_id: chatId,
      user_id: userId,
    });
  }

  /**
   * Answer callback query
   */
  async answerCallbackQuery(callbackQueryId, options = {}) {
    return this.request("answerCallbackQuery", {
      callback_query_id: callbackQueryId,
      ...options,
    });
  }

  /**
   * Edit message reply markup (keyboard)
   */
  async editMessageReplyMarkup(chatId, messageId, replyMarkup) {
    return this.request("editMessageReplyMarkup", {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: replyMarkup,
    });
  }
}
