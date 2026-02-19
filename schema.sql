-- D1 schema for NonFictionFooty (TikTok-API-free: jobs only)
-- Run: wrangler d1 execute nonfictionfooty-db --remote --file=schema.sql

-- Jobs: generate → export workflow
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'pending',
  topic TEXT,
  team_or_player TEXT,
  era_or_match TEXT,
  tone TEXT,
  duration_sec INTEGER,
  style_preset TEXT,
  script_json TEXT,
  caption TEXT,
  hashtags TEXT,
  output_final_mp4 TEXT,
  output_captions_json TEXT,
  output_subtitles_srt TEXT,
  output_cover_png TEXT,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
