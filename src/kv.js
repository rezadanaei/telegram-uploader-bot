/**
 * KV Session Management Module
 * Handles admin state and draft data storage
 */

export class KVSessionManager {
  constructor(kv) {
    this.kv = kv;
  }

  /**
   * Get admin state key
   */
  getStateKey(userId) {
    return `state:${userId}`;
  }

  /**
   * Set admin current state
   */
  async setState(userId, state) {
    await this.kv.put(this.getStateKey(userId), state);
    console.log(`[KV] State set for user ${userId}: ${state}`);
  }

  /**
   * Get admin current state
   */
  async getState(userId) {
    const state = await this.kv.get(this.getStateKey(userId));
    return state || null;
  }

  /**
   * Delete state
   */
  async deleteState(userId) {
    await this.kv.delete(this.getStateKey(userId));
  }

  /**
   * Get draft data key
   */
  getDraftKey(userId, field) {
    return `draft:${userId}:${field}`;
  }

  /**
   * Save draft title
   */
  async saveDraftTitle(userId, title) {
    await this.kv.put(this.getDraftKey(userId, "title"), title);
    console.log(`[KV] Draft title saved for user ${userId}`);
  }

  /**
   * Get draft title
   */
  async getDraftTitle(userId) {
    return await this.kv.get(this.getDraftKey(userId, "title"));
  }

  /**
   * Save draft banner file ID
   */
  async saveDraftBanner(userId, fileId) {
    await this.kv.put(this.getDraftKey(userId, "banner"), fileId);
    console.log(`[KV] Draft banner saved for user ${userId}`);
  }

  /**
   * Get draft banner file ID
   */
  async getDraftBanner(userId) {
    return await this.kv.get(this.getDraftKey(userId, "banner"));
  }

  /**
   * Add video to draft list
   */
  async addDraftVideo(userId, quality, fileId, uniqueMsgId) {
    const countKey = this.getDraftKey(userId, "video_count");
    const currentCount = parseInt((await this.kv.get(countKey)) || "0");
    const newCount = currentCount + 1;

    // Save video with quality and file ID
    await this.kv.put(
      this.getDraftKey(userId, `v_${newCount}_quality`),
      quality.toString(),
    );
    await this.kv.put(this.getDraftKey(userId, `v_${newCount}_fileId`), fileId);
    await this.kv.put(
      this.getDraftKey(userId, `v_${newCount}_msgId`),
      uniqueMsgId.toString(),
    );

    // Update counter
    await this.kv.put(countKey, newCount.toString());

    console.log(`[KV] Video ${newCount} added for user ${userId}`);
    return newCount;
  }

  /**
   * Get all draft videos
   */
  async getDraftVideos(userId) {
    const countKey = this.getDraftKey(userId, "video_count");
    const count = parseInt((await this.kv.get(countKey)) || "0");

    const videos = [];
    for (let i = 1; i <= count; i++) {
      const quality = await this.kv.get(
        this.getDraftKey(userId, `v_${i}_quality`),
      );
      const fileId = await this.kv.get(
        this.getDraftKey(userId, `v_${i}_fileId`),
      );
      const uniqueMsgId = await this.kv.get(
        this.getDraftKey(userId, `v_${i}_msgId`),
      );

      if (quality && fileId && uniqueMsgId) {
        videos.push({
          quality: parseInt(quality),
          fileId,
          uniqueMsgId: parseInt(uniqueMsgId),
        });
      }
    }

    return videos;
  }

  /**
   * Clear all draft data for a user
   */
  async clearDraft(userId) {
    const keys = ["title", "banner", "video_count"];

    // Delete main draft keys
    await Promise.all(
      keys.map((key) => this.kv.delete(this.getDraftKey(userId, key))),
    );

    // Delete all video entries
    const countKey = this.getDraftKey(userId, "video_count");
    const count = parseInt((await this.kv.get(countKey)) || "0");

    const videoKeys = [];
    for (let i = 1; i <= count; i++) {
      videoKeys.push(this.getDraftKey(userId, `v_${i}_quality`));
      videoKeys.push(this.getDraftKey(userId, `v_${i}_fileId`));
      videoKeys.push(this.getDraftKey(userId, `v_${i}_msgId`));
    }

    await Promise.all(videoKeys.map((key) => this.kv.delete(key)));

    console.log(`[KV] Draft cleared for user ${userId}`);
  }

  /**
   * Get user language preference from KV cache
   */
  getLanguageCacheKey(userId) {
    return `lang:${userId}`;
  }

  /**
   * Get cached user language
   */
  async getUserLanguage(userId) {
    const cached = await this.kv.get(this.getLanguageCacheKey(userId));
    return cached || null;
  }

  /**
   * Set cached user language (with 24-hour TTL)
   */
  async setUserLanguage(userId, language) {
    await this.kv.put(this.getLanguageCacheKey(userId), language, {
      expirationTtl: 86400, // 24 hours
    });
  }

  /**
   * Clear language cache (e.g., when user changes language)
   */
  async clearLanguageCache(userId) {
    await this.kv.delete(this.getLanguageCacheKey(userId));
  }
}
