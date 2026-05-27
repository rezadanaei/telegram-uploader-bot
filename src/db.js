/**
 * Database Module (Cloudflare D1)
 * Handles all database operations with error handling
 */

export class DatabaseManager {
  constructor(db) {
    this.db = db;
  }

  /**
   * Create a new movie and return the ID
   */
  async createMovie(title, bannerFileId, maxQuality) {
    try {
      const result = await this.db
        .prepare(
          `INSERT INTO movies (title, banner_file_id, max_quality, created_at) 
           VALUES (?, ?, ?, datetime('now'))`,
        )
        .bind(title, bannerFileId, maxQuality)
        .run();

      console.log(`[DB] Movie created with ID: ${result.meta.last_row_id}`);
      return result.meta.last_row_id;
    } catch (error) {
      console.error("[DB] Failed to create movie:", error);
      throw error;
    }
  }

  /**
   * Get movie details by ID
   */
  async getMovie(movieId) {
    try {
      const result = await this.db
        .prepare("SELECT * FROM movies WHERE id = ?")
        .bind(movieId)
        .first();

      return result || null;
    } catch (error) {
      console.error(`[DB] Failed to get movie ${movieId}:`, error);
      throw error;
    }
  }

  /**
   * Add video file to movie
   */
  async addVideoFile(movieId, quality, telegramFileId, uniqueMsgId) {
    try {
      const result = await this.db
        .prepare(
          `INSERT INTO video_files (movie_id, quality, telegram_file_id, unique_msg_id, created_at)
           VALUES (?, ?, ?, ?, datetime('now'))`,
        )
        .bind(movieId, quality, telegramFileId, uniqueMsgId)
        .run();

      console.log(
        `[DB] Video file added to movie ${movieId}: quality=${quality}`,
      );
      return result.meta.last_row_id;
    } catch (error) {
      console.error("[DB] Failed to add video file:", error);
      throw error;
    }
  }

  /**
   * Get all video files for a movie, ordered by quality DESC
   */
  async getMovieVideos(movieId) {
    try {
      const results = await this.db
        .prepare(
          `SELECT * FROM video_files 
           WHERE movie_id = ? 
           ORDER BY quality DESC, created_at ASC`,
        )
        .bind(movieId)
        .all();

      return results.results || [];
    } catch (error) {
      console.error(`[DB] Failed to get videos for movie ${movieId}:`, error);
      throw error;
    }
  }

  /**
   * Get single video file by quality
   */
  async getVideoByQuality(movieId, quality) {
    try {
      const result = await this.db
        .prepare(
          `SELECT * FROM video_files 
           WHERE movie_id = ? AND quality = ? 
           LIMIT 1`,
        )
        .bind(movieId, quality)
        .first();

      return result || null;
    } catch (error) {
      console.error(
        `[DB] Failed to get video for movie ${movieId}, quality ${quality}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Batch insert video files (transaction)
   */
  async batchInsertVideoFiles(movieId, videos) {
    try {
      const promises = videos.map((video) =>
        this.addVideoFile(
          movieId,
          video.quality,
          video.fileId,
          video.uniqueMsgId,
        ),
      );

      await Promise.all(promises);
      console.log(`[DB] Batch inserted ${videos.length} video files`);
    } catch (error) {
      console.error("[DB] Batch insert failed:", error);
      throw error;
    }
  }

  /**
   * Get highest quality for a movie
   */
  async getMaxQuality(movieId) {
    try {
      const result = await this.db
        .prepare(
          `SELECT MAX(quality) as max_quality FROM video_files WHERE movie_id = ?`,
        )
        .bind(movieId)
        .first();

      return result?.max_quality || 480;
    } catch (error) {
      console.error(
        `[DB] Failed to get max quality for movie ${movieId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get user's preferred language
   */
  async getUserLanguage(userId) {
    try {
      const result = await this.db
        .prepare("SELECT language FROM users WHERE user_id = ?")
        .bind(userId)
        .first();

      return result?.language || null;
    } catch (error) {
      console.error(`[DB] Failed to get user language for ${userId}:`, error);
      return null;
    }
  }

  /**
   * Set user's preferred language
   */
  async setUserLanguage(userId, language) {
    try {
      await this.db
        .prepare(
          `INSERT INTO users (user_id, language, created_at, updated_at)
           VALUES (?, ?, datetime('now'), datetime('now'))
           ON CONFLICT(user_id) DO UPDATE SET
           language = excluded.language,
           updated_at = datetime('now')`,
        )
        .bind(userId, language)
        .run();

      console.log(`[DB] User ${userId} language set to: ${language}`);
    } catch (error) {
      console.error(`[DB] Failed to set user language for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check if user has selected a language
   */
  async hasUserLanguage(userId) {
    try {
      const result = await this.db
        .prepare("SELECT 1 FROM users WHERE user_id = ?")
        .bind(userId)
        .first();

      return !!result;
    } catch (error) {
      console.error(`[DB] Failed to check user language for ${userId}:`, error);
      return false;
    }
  }

  // ============ ADMIN SETTINGS METHODS ============

  /**
   * Get admin's post template
   */
  async getAdminTemplate(userId) {
    try {
      const result = await this.db
        .prepare("SELECT template FROM admin_settings WHERE user_id = ?")
        .bind(userId)
        .first();

      return result?.template || null;
    } catch (error) {
      console.error(`[DB] Failed to get template for admin ${userId}:`, error);
      return null;
    }
  }

  /**
   * Save admin's post template
   */
  async saveAdminTemplate(userId, template) {
    try {
      await this.db
        .prepare(
          `INSERT INTO admin_settings (user_id, template, button_language, created_at, updated_at)
           VALUES (?, ?, 'fa', datetime('now'), datetime('now'))
           ON CONFLICT(user_id) DO UPDATE SET
           template = excluded.template,
           updated_at = datetime('now')`,
        )
        .bind(userId, template)
        .run();

      console.log(`[DB] Template saved for admin ${userId}`);
    } catch (error) {
      console.error(`[DB] Failed to save template for admin ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get admin's button language preference
   */
  async getAdminButtonLanguage(userId) {
    try {
      const result = await this.db
        .prepare("SELECT button_language FROM admin_settings WHERE user_id = ?")
        .bind(userId)
        .first();

      return result?.button_language || "fa";
    } catch (error) {
      console.error(
        `[DB] Failed to get button language for admin ${userId}:`,
        error,
      );
      return "fa";
    }
  }

  /**
   * Save admin's button language preference
   */
  async saveAdminButtonLanguage(userId, language) {
    try {
      await this.db
        .prepare(
          `INSERT INTO admin_settings (user_id, button_language, template, created_at, updated_at)
           VALUES (?, ?, '{title}', datetime('now'), datetime('now'))
           ON CONFLICT(user_id) DO UPDATE SET
           button_language = excluded.button_language,
           updated_at = datetime('now')`,
        )
        .bind(userId, language)
        .run();

      console.log(
        `[DB] Button language set to ${language} for admin ${userId}`,
      );
    } catch (error) {
      console.error(
        `[DB] Failed to save button language for admin ${userId}:`,
        error,
      );
      throw error;
    }
  }

  // ============ PENDING POSTS METHODS (APPROVAL WORKFLOW) ============

  /**
   * Create a pending post (awaiting admin approval)
   */
  async createPendingPost(movieId, adminId, caption) {
    try {
      const result = await this.db
        .prepare(
          `INSERT INTO pending_posts (movie_id, admin_id, caption, status, created_at, updated_at)
           VALUES (?, ?, ?, 'pending', datetime('now'), datetime('now'))`,
        )
        .bind(movieId, adminId, caption)
        .run();

      console.log(`[DB] Pending post created: ID ${result.meta.last_row_id}`);
      return result.meta.last_row_id;
    } catch (error) {
      console.error("[DB] Failed to create pending post:", error);
      throw error;
    }
  }

  /**
   * Get pending post by ID
   */
  async getPendingPost(postId) {
    try {
      const result = await this.db
        .prepare("SELECT * FROM pending_posts WHERE id = ?")
        .bind(postId)
        .first();

      return result || null;
    } catch (error) {
      console.error(`[DB] Failed to get pending post ${postId}:`, error);
      throw error;
    }
  }

  /**
   * Get all pending posts for a specific admin
   */
  async getPendingPostsByAdmin(adminId) {
    try {
      const results = await this.db
        .prepare(
          `SELECT * FROM pending_posts 
           WHERE admin_id = ? AND status = 'pending'
           ORDER BY created_at DESC`,
        )
        .bind(adminId)
        .all();

      return results.results || [];
    } catch (error) {
      console.error(
        `[DB] Failed to get pending posts for admin ${adminId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Update pending post status (pending, approved, rejected, published)
   */
  async updatePendingPostStatus(postId, status) {
    try {
      await this.db
        .prepare(
          `UPDATE pending_posts SET status = ?, updated_at = datetime('now')
           WHERE id = ?`,
        )
        .bind(status, postId)
        .run();

      console.log(`[DB] Pending post ${postId} status updated to: ${status}`);
    } catch (error) {
      console.error(
        `[DB] Failed to update pending post ${postId} status:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Update pending post caption
   */
  async updatePendingPostCaption(postId, caption) {
    try {
      await this.db
        .prepare(
          `UPDATE pending_posts SET caption = ?, updated_at = datetime('now')
           WHERE id = ?`,
        )
        .bind(caption, postId)
        .run();

      console.log(`[DB] Pending post ${postId} caption updated`);
    } catch (error) {
      console.error(
        `[DB] Failed to update pending post ${postId} caption:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get pending post with movie details
   */
  async getPendingPostWithMovie(postId) {
    try {
      const result = await this.db
        .prepare(
          `SELECT pp.*, m.title, m.banner_file_id, m.max_quality
           FROM pending_posts pp
           JOIN movies m ON pp.movie_id = m.id
           WHERE pp.id = ?`,
        )
        .bind(postId)
        .first();

      return result || null;
    } catch (error) {
      console.error(
        `[DB] Failed to get pending post with movie details:`,
        error,
      );
      throw error;
    }
  }

  // ============ DATABASE CHANNEL FILE TRACKING ============

  /**
   * Store mapping between video file and database channel backup
   */
  async storeDbChannelFileMapping(
    videoFileId,
    dbChannelMsgId,
    dbChannelFileId,
  ) {
    try {
      await this.db
        .prepare(
          `INSERT INTO db_channel_files (video_file_id, db_channel_msg_id, db_channel_file_id, created_at)
           VALUES (?, ?, ?, datetime('now'))`,
        )
        .bind(videoFileId, dbChannelMsgId, dbChannelFileId)
        .run();

      console.log(
        `[DB] DB Channel mapping stored: video_file_id=${videoFileId}`,
      );
    } catch (error) {
      console.error("[DB] Failed to store DB channel file mapping:", error);
      throw error;
    }
  }

  /**
   * Get database channel file mapping
   */
  async getDbChannelFileMapping(videoFileId) {
    try {
      const result = await this.db
        .prepare("SELECT * FROM db_channel_files WHERE video_file_id = ?")
        .bind(videoFileId)
        .first();

      return result || null;
    } catch (error) {
      console.error(
        `[DB] Failed to get DB channel mapping for video ${videoFileId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Get all database channel backups for a movie
   */
  async getMovieDbChannelBackups(movieId) {
    try {
      const results = await this.db
        .prepare(
          `SELECT dcf.* FROM db_channel_files dcf
           JOIN video_files vf ON dcf.video_file_id = vf.id
           WHERE vf.movie_id = ?
           ORDER BY vf.quality DESC`,
        )
        .bind(movieId)
        .all();

      return results.results || [];
    } catch (error) {
      console.error(
        `[DB] Failed to get DB channel backups for movie ${movieId}:`,
        error,
      );
      throw error;
    }
  }
}
