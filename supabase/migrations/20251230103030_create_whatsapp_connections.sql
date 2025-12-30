/*
  # WhatsApp Connections System

  1. New Tables
    - `whatsapp_connections`
      - `id` (uuid, primary key)
      - `name` (text, friendly name for the connection)
      - `phone_number` (text, phone number linked)
      - `status` (text, connected/disconnected/scanning)
      - `qr_code` (text, QR code data for authentication)
      - `session_data` (jsonb, session information)
      - `is_active` (boolean, whether connection is active)
      - `last_connected_at` (timestamptz, last connection time)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on whatsapp_connections table
    - Add policies for public access (can be restricted later)
*/

-- WhatsApp Connections Table
CREATE TABLE IF NOT EXISTS whatsapp_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone_number text,
  status text DEFAULT 'disconnected',
  qr_code text,
  session_data jsonb,
  is_active boolean DEFAULT true,
  last_connected_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('connected', 'disconnected', 'scanning', 'error'))
);

ALTER TABLE whatsapp_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to whatsapp_connections"
  ON whatsapp_connections FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to whatsapp_connections"
  ON whatsapp_connections FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to whatsapp_connections"
  ON whatsapp_connections FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete to whatsapp_connections"
  ON whatsapp_connections FOR DELETE
  USING (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_status ON whatsapp_connections(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_is_active ON whatsapp_connections(is_active);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_whatsapp_connections_updated_at ON whatsapp_connections;
CREATE TRIGGER update_whatsapp_connections_updated_at
  BEFORE UPDATE ON whatsapp_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add whatsapp_connection_id to sending_history
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sending_history' AND column_name = 'whatsapp_connection_id'
  ) THEN
    ALTER TABLE sending_history 
    ADD COLUMN whatsapp_connection_id uuid REFERENCES whatsapp_connections(id) ON DELETE SET NULL;
  END IF;
END $$;