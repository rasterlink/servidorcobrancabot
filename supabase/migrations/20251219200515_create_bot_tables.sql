/*
  # Criar tabelas do WhatsApp Bot

  1. Novas Tabelas
    - `bot_config`
      - `id` (uuid, primary key)
      - `openai_key` (text) - Chave da OpenAI
      - `prompt` (text) - Prompt do sistema para a IA
      - `auto_reply` (boolean) - Se deve responder automaticamente
      - `created_at` (timestamptz) - Data de criação
      - `updated_at` (timestamptz) - Data de atualização
    
    - `conversations`
      - `id` (uuid, primary key)
      - `phone` (text) - Número do telefone
      - `message` (text) - Conteúdo da mensagem
      - `type` (text) - Tipo: 'received' ou 'sent'
      - `timestamp` (timestamptz) - Data/hora da mensagem

  2. Segurança
    - Enable RLS em ambas as tabelas
    - Políticas públicas para permitir acesso (app interno)
*/

CREATE TABLE IF NOT EXISTS bot_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  openai_key text DEFAULT '',
  prompt text DEFAULT 'Você é um assistente útil.',
  auto_reply boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  timestamp timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_phone ON conversations(phone);
CREATE INDEX IF NOT EXISTS idx_conversations_timestamp ON conversations(timestamp DESC);

ALTER TABLE bot_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to bot_config"
  ON bot_config
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to conversations"
  ON conversations
  FOR ALL
  USING (true)
  WITH CHECK (true);
