-- D1 schema for NonFictionFooty
-- Run: wrangler d1 execute nonfictionfooty-db --remote --file=schema.sql

CREATE TABLE IF NOT EXISTS drafts (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'DRAFT',
  headline TEXT,
  story_json TEXT,
  sources_json TEXT,
  min_slides INTEGER NOT NULL DEFAULT 3,
  max_slides INTEGER NOT NULL DEFAULT 10,
  chosen_slide_count INTEGER,
  caption TEXT,
  hashtags TEXT,
  image_candidates_json TEXT,
  chosen_images_json TEXT,
  tiktok_publish_id TEXT,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_drafts_status ON drafts(status);
CREATE INDEX IF NOT EXISTS idx_drafts_created_at ON drafts(created_at DESC);

CREATE TABLE IF NOT EXISTS tiktok_auth (
  open_id TEXT PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
