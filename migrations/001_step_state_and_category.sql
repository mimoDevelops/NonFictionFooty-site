-- Migration: step-based pipeline and topic-agnostic category
-- Run on existing DB: npx wrangler d1 execute nonfictionfooty-db --remote --file=migrations/001_step_state_and_category.sql
-- Backwards compatible: new columns nullable; existing jobs unchanged.

ALTER TABLE jobs ADD COLUMN category TEXT;
ALTER TABLE jobs ADD COLUMN steps_json TEXT;
ALTER TABLE jobs ADD COLUMN context_json TEXT;
