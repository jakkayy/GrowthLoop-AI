ALTER TABLE users
  ADD COLUMN IF NOT EXISTS caption_system_prompt TEXT,
  ADD COLUMN IF NOT EXISTS image_prompt_prefix TEXT;
