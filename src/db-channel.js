/**
 * Database Channel Integration Module
 * Securely stores and retrieves video files from the Database Channel
 * Ensures the Database Channel identity is completely hidden from users
 */

import { logAction } from "./utils.js";

export class DatabaseChannelManager {
  constructor(telegramAPI, dbManager, databaseChannelId) {
    this.telegramAPI = telegramAPI;
    this.db = dbManager;
    this.databaseChannelId = databaseChannelId;
  }

  /**
   * Store video file in Database Channel
   * This is called when a video file is uploaded during movie creation
   */
  async storeVideoInDatabaseChannel(videoFileId, videoQuality, movieId) {
    logAction("STORE_VIDEO_DB_CHANNEL", videoFileId, {
      quality: videoQuality,
      movieId,
    });

    try {
      // Send the video to the database channel
      // Using a caption-less send to minimize metadata
      const result = await this.telegramAPI.sendVideo(
        this.databaseChannelId,
        videoFileId,
        {
          caption: `[BACKUP] Movie ID: ${movieId}, Quality: ${videoQuality}p`,
          disable_notification: true,
        },
      );

      if (!result || !result.video) {
        throw new Error("Failed to store video in database channel");
      }

      // Extract the file_id from the response
      const dbChannelFileId = result.video.file_id;
      const dbChannelMsgId = result.message_id;

      // Store the mapping for future retrieval
      // This is crucial - we need to know where to fetch the file from
      await this.db.storeDbChannelFileMapping(
        videoFileId,
        dbChannelMsgId,
        dbChannelFileId,
      );

      console.log(
        `[DBChannel] Video stored successfully: msgId=${dbChannelMsgId}, fileId=${dbChannelFileId}`,
      );

      return {
        dbChannelMsgId,
        dbChannelFileId,
      };
    } catch (error) {
      console.error(
        "[DBChannel] Failed to store video in database channel:",
        error,
      );
      throw error;
    }
  }

  /**
   * Retrieve video from Database Channel securely
   * Uses copyMessage to forward without revealing Database Channel info
   * OR sends video with file_id directly
   */
  async retrieveVideoSecurely(videoFileId, chatId) {
    logAction("RETRIEVE_VIDEO_SECURE", videoFileId, { targetChat: chatId });

    try {
      // Get the mapping information
      const mapping = await this.db.getDbChannelFileMapping(videoFileId);

      if (!mapping) {
        throw new Error(`No mapping found for video file ${videoFileId}`);
      }

      // Method 1: Send video directly using file_id (RECOMMENDED - no forward header)
      // This completely hides the Database Channel's existence
      const result = await this.telegramAPI.sendVideo(
        chatId,
        mapping.db_channel_file_id,
        {
          disable_notification: false,
        },
      );

      console.log(
        `[DBChannel] Video retrieved securely from DB channel: ${videoFileId}`,
      );

      return result;
    } catch (error) {
      console.error("[DBChannel] Failed to retrieve video securely:", error);
      throw error;
    }
  }

  /**
   * Alternative secure retrieval: Copy message without revealing source
   * Use this if file_id method doesn't work or to completely hide forwarding
   */
  async retrieveVideoVioCopy(videoFileId, chatId) {
    logAction("RETRIEVE_VIDEO_COPY", videoFileId, { targetChat: chatId });

    try {
      const mapping = await this.db.getDbChannelFileMapping(videoFileId);

      if (!mapping) {
        throw new Error(`No mapping found for video file ${videoFileId}`);
      }

      // Use copyMessage - this forwards without showing the original sender
      const result = await this.telegramAPI.copyMessage(
        chatId,
        this.databaseChannelId,
        mapping.db_channel_msg_id,
        {
          disable_notification: false,
        },
      );

      console.log(
        `[DBChannel] Video retrieved via copyMessage: ${videoFileId}`,
      );

      return result;
    } catch (error) {
      console.error("[DBChannel] Failed to copy message:", error);
      throw error;
    }
  }

  /**
   * Batch check if videos exist in database channel
   */
  async checkVideoExistence(videoFileIds) {
    try {
      const results = {};

      for (const videoFileId of videoFileIds) {
        try {
          const mapping = await this.db.getDbChannelFileMapping(videoFileId);
          results[videoFileId] = mapping ? true : false;
        } catch (error) {
          results[videoFileId] = false;
        }
      }

      console.log(
        `[DBChannel] Checked ${videoFileIds.length} videos, available: ${Object.values(results).filter((v) => v).length}`,
      );

      return results;
    } catch (error) {
      console.error("[DBChannel] Failed to check video existence:", error);
      throw error;
    }
  }

  /**
   * Get all backup videos for a movie
   */
  async getMovieBackupVideos(movieId) {
    try {
      const videos = await this.db.getMovieVideos(movieId);
      const backups = [];

      for (const video of videos) {
        const mapping = await this.db.getDbChannelFileMapping(video.id);
        if (mapping) {
          backups.push({
            ...video,
            db_channel_msg_id: mapping.db_channel_msg_id,
            db_channel_file_id: mapping.db_channel_file_id,
          });
        }
      }

      console.log(
        `[DBChannel] Retrieved ${backups.length} backup videos for movie ${movieId}`,
      );

      return backups;
    } catch (error) {
      console.error("[DBChannel] Failed to get backup videos:", error);
      throw error;
    }
  }

  /**
   * Verify Database Channel access
   * Test if the bot can send/receive messages
   */
  async verifyDatabaseChannelAccess() {
    try {
      // Try to send a test message
      const testResult = await this.telegramAPI.sendMessage(
        this.databaseChannelId,
        "🤖 Database Channel Access Test - Timestamp: " +
          new Date().toISOString(),
        { disable_notification: true },
      );

      if (testResult && testResult.message_id) {
        console.log(
          `[DBChannel] ✅ Database Channel access verified: ${this.databaseChannelId}`,
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error(
        "[DBChannel] ❌ Failed to verify database channel access:",
        error,
      );
      return false;
    }
  }
}
