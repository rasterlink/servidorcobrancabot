/*
  # Sistema de Cobrança com Memória da IA

  ## Novas Tabelas
  
  ### 1. `customers` (Clientes)
  Armazena informações dos clientes devedores:
  - `id` (uuid, primary key) - ID único do cliente
  - `phone` (text, unique) - Número do WhatsApp (ex: 5511999999999@s.whatsapp.net)
  - `name` (text) - Nome do cliente
  - `amount_due` (numeric) - Valor devido em reais
  - `due_date` (date) - Data de vencimento
  - `invoice_number` (text) - Número da fatura/boleto
  - `notes` (text) - Observações adicionais
  - `status` (text) - Status: 'pending', 'negotiating', 'paid', 'overdue'
  - `created_at` (timestamptz) - Data de criação
  - `updated_at` (timestamptz) - Data de atualização

  ### 2. `conversation_history` (Histórico de Conversas)
  Armazena histórico completo de conversas para memória da IA:
  - `id` (uuid, primary key) - ID único
  - `customer_id` (uuid, foreign key) - Referência ao cliente
  - `phone` (text) - Número do WhatsApp
  - `message` (text) - Conteúdo da mensagem
  - `role` (text) - 'user' ou 'assistant'
  - `timestamp` (timestamptz) - Data e hora da mensagem

  ## Segurança
  - RLS habilitado em todas as tabelas
  - Políticas para acesso público (este é um sistema interno)

  ## Índices
  - Índice em `customers.phone` para busca rápida
  - Índice em `conversation_history.customer_id` para consultas de histórico
  - Índice em `conversation_history.phone` para busca por telefone
*/

-- Criar tabela de clientes
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE NOT NULL,
  name text NOT NULL,
  amount_due numeric(10,2) NOT NULL DEFAULT 0,
  due_date date,
  invoice_number text,
  notes text DEFAULT '',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'negotiating', 'paid', 'overdue')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de histórico de conversas
CREATE TABLE IF NOT EXISTS conversation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  phone text NOT NULL,
  message text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  timestamp timestamptz DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_conversation_customer ON conversation_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversation_phone ON conversation_history(phone);
CREATE INDEX IF NOT EXISTS idx_conversation_timestamp ON conversation_history(timestamp DESC);

-- Habilitar RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (público para sistema interno)
CREATE POLICY "Allow all access to customers"
  ON customers FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to conversation_history"
  ON conversation_history FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
