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
}
