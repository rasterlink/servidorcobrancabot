/*
  # Update conversations table structure

  1. Changes
    - Add `customer_phone` column if not exists
    - Add `customer_name` column if not exists
    - Add `ai_paused` column if not exists (default false)
    - Update existing records to populate customer_phone from phone field

  2. Purpose
    - Support new conversation UI with grouped chats
    - Enable AI pause/resume per conversation
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'customer_phone'
  ) THEN
    ALTER TABLE conversations ADD COLUMN customer_phone text;
    UPDATE conversations SET customer_phone = phone WHERE customer_phone IS NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'customer_name'
  ) THEN
    ALTER TABLE conversations ADD COLUMN customer_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'ai_paused'
  ) THEN
    ALTER TABLE conversations ADD COLUMN ai_paused boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'last_message'
  ) THEN
    ALTER TABLE conversations ADD COLUMN last_message timestamptz;
    UPDATE conversations SET last_message = timestamp WHERE last_message IS NULL;
  END IF;
END $$;
