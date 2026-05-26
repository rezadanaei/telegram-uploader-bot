/**
 * Security & Access Control Module
 * Handles admin verification and caching
 */

export class SecurityManager {
  constructor(telegramAPI, kv, databaseChannelId, cacheTTL = 3600) {
    this.telegramAPI = telegramAPI;
    this.kv = kv;
    this.databaseChannelId = databaseChannelId;
    this.cacheTTL = cacheTTL;
  }

  /**
   * Generate cache key for admin status
   */
  getAdminCacheKey(userId) {
    return `admin:${userId}`;
  }

  /**
   * Check if user is admin of DATABASE_CHANNEL with KV caching
   */
  async isUserAdmin(userId) {
    // Check KV cache first
    const cachedAdmin = await this.kv.get(this.getAdminCacheKey(userId));

    if (cachedAdmin === "true") {
      console.log(`[Security] Admin status cached for user ${userId}`);
      return true;
    }

    if (cachedAdmin === "false") {
      console.log(`[Security] Non-admin cached for user ${userId}`);
      return false;
    }

    // Cache miss - verify with Telegram API
    try {
      const member = await this.telegramAPI.getChatMember(
        this.databaseChannelId,
        userId,
      );

      const isAdmin = ["creator", "administrator"].includes(member.status);

      // Cache the result
      await this.kv.put(
        this.getAdminCacheKey(userId),
        isAdmin ? "true" : "false",
        { expirationTtl: this.cacheTTL },
      );

      console.log(`[Security] User ${userId} admin status: ${isAdmin}`);
      return isAdmin;
    } catch (error) {
      console.error(`[Security] Failed to verify admin status:`, error);
      // On error, assume non-admin for security
      return false;
    }
  }

  /**
   * Verify request is from authorized admin
   */
  async verifyAdmin(userId) {
    const isAdmin = await this.isUserAdmin(userId);
    if (!isAdmin) {
      console.warn(`[Security] Unauthorized access attempt by user ${userId}`);
    }
    return isAdmin;
  }

  /**
   * Invalidate admin cache for a user
   */
  async invalidateAdminCache(userId) {
    await this.kv.delete(this.getAdminCacheKey(userId));
    console.log(`[Security] Cache invalidated for user ${userId}`);
  }
}
