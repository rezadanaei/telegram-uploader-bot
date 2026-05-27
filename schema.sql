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

-- Admin Settings Table (Template Management)
CREATE TABLE IF NOT EXISTS admin_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  template TEXT NOT NULL DEFAULT '{title}\n\n📽️ {max_quality}\n\n{qualities_list}',
  button_language TEXT NOT NULL DEFAULT 'fa',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Pending Posts Table (Approval Workflow)
CREATE TABLE IF NOT EXISTS pending_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  movie_id INTEGER NOT NULL,
  admin_id INTEGER NOT NULL,
  caption TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  preview_message_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
);

-- Database Channel Files Tracking (Secure Storage)
CREATE TABLE IF NOT EXISTS db_channel_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_file_id INTEGER NOT NULL UNIQUE,
  db_channel_msg_id INTEGER NOT NULL,
  db_channel_file_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (video_file_id) REFERENCES video_files(id) ON DELETE CASCADE
);

-- Indexes for optimized queries
CREATE INDEX IF NOT EXISTS idx_video_files_movie_id ON video_files(movie_id);
CREATE INDEX IF NOT EXISTS idx_video_files_quality ON video_files(quality);
CREATE INDEX IF NOT EXISTS idx_movies_created_at ON movies(created_at);
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_settings_user_id ON admin_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_posts_movie_id ON pending_posts(movie_id);
CREATE INDEX IF NOT EXISTS idx_pending_posts_status ON pending_posts(status);
CREATE INDEX IF NOT EXISTS idx_db_channel_files_video_id ON db_channel_files(video_file_id);
