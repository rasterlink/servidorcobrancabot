/*
  # Create Bulk Messages System

  1. New Tables
    - `bulk_messages`
      - `id` (uuid, primary key)
      - `connection_id` (uuid, foreign key to whatsapp_connections)
      - `name` (text) - Nome do cliente
      - `phone` (text) - Telefone do cliente
      - `contrato` (text) - Número do contrato
      - `veiculo` (text) - Modelo do veículo
      - `placa` (text) - Placa do veículo
      - `chassi` (text) - Chassi do veículo
      - `valor` (text) - Valor da parcela
      - `valor_total` (text) - Valor total
      - `valor_juros` (text) - Valor com juros
      - `pix` (text) - Chave PIX
      - `message` (text) - Mensagem formatada
      - `status` (text) - Status do envio (pending, sent, failed)
      - `sent_at` (timestamptz) - Data/hora do envio
      - `error_message` (text) - Mensagem de erro se falhar
      - `created_at` (timestamptz)
      
  2. Security
    - Enable RLS on `bulk_messages` table
    - Add policies for public access
*/

CREATE TABLE IF NOT EXISTS bulk_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  contrato text DEFAULT '',
  veiculo text DEFAULT '',
  placa text DEFAULT '',
  chassi text DEFAULT '',
  valor text DEFAULT '',
  valor_total text DEFAULT '',
  valor_juros text DEFAULT '',
  pix text DEFAULT '',
  message text NOT NULL,
  status text DEFAULT 'pending',
  sent_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bulk_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to bulk_messages"
  ON bulk_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow public insert to bulk_messages"
  ON bulk_messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update to bulk_messages"
  ON bulk_messages FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete to bulk_messages"
  ON bulk_messages FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_bulk_messages_connection_id ON bulk_messages(connection_id);
CREATE INDEX IF NOT EXISTS idx_bulk_messages_status ON bulk_messages(status);
CREATE INDEX IF NOT EXISTS idx_bulk_messages_created_at ON bulk_messages(created_at DESC);