-- Database Schema for Telegram Uploader Bot
-- This schema defines the structure for storing movies and their associated video files

CREATE TABLE IF NOT EXISTS movies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  banner_file_id TEXT NOT NULL,
  max_quality INTEGER NOT NULL DEFAULT 480,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS video_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  movie_id INTEGER NOT NULL,
  quality INTEGER NOT NULL,
  telegram_file_id TEXT NOT NULL,
  unique_msg_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE,
  language TEXT NOT NULL DEFAULT 'en',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for optimized queries
CREATE INDEX IF NOT EXISTS idx_video_files_movie_id ON video_files(movie_id);
CREATE INDEX IF NOT EXISTS idx_video_files_quality ON video_files(quality);
CREATE INDEX IF NOT EXISTS idx_movies_created_at ON movies(created_at);
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
