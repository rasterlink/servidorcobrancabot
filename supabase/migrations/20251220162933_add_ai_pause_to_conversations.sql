/*
  # Add AI pause control to conversations

  1. Changes
    - Add `ai_paused` boolean column to `conversations` table (default false)
    - This allows users to manually take over conversations and pause automatic AI responses

  2. Purpose
    - Users can pause the AI to handle conversations manually
    - System will skip AI responses for paused conversations
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'ai_paused'
  ) THEN
    ALTER TABLE conversations ADD COLUMN ai_paused boolean DEFAULT false;
  END IF;
END $$;
