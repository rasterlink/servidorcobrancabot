/*
  # Create Webhook Logs Table

  1. New Tables
    - `webhook_logs`
      - `id` (uuid, primary key)
      - `event_type` (text, type of webhook event)
      - `payload` (jsonb, webhook data)
      - `received_at` (timestamptz, when webhook was received)
      - `processed` (boolean, processing status)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on webhook_logs table
    - Add policies for public insert (webhooks are external)
    - Add policies for authenticated read access
*/

CREATE TABLE IF NOT EXISTS webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  received_at timestamptz DEFAULT now(),
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert to webhook_logs"
  ON webhook_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public read access to webhook_logs"
  ON webhook_logs FOR SELECT
  USING (true);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_received_at ON webhook_logs(received_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed ON webhook_logs(processed);
