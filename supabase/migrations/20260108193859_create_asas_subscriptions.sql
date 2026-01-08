/*
  # Criar tabela de assinaturas Asaas

  1. Nova Tabela
    - `asas_subscriptions`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, referência para customers)
      - `asas_customer_id` (text, ID do cliente no Asaas)
      - `asas_subscription_id` (text, ID da assinatura no Asaas, único)
      - `value` (numeric, valor da assinatura)
      - `cycle` (text, ciclo de cobrança: MONTHLY, QUARTERLY, etc)
      - `description` (text, descrição da assinatura)
      - `next_due_date` (date, próxima data de vencimento)
      - `status` (text, status da assinatura)
      - `external_reference` (text, referência externa)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Segurança
    - Habilitar RLS na tabela `asas_subscriptions`
    - Adicionar política para usuários autenticados lerem dados
    - Adicionar política para usuários autenticados inserirem dados
    - Adicionar política para usuários autenticados atualizarem dados

  3. Atualizar tabela asas_boletos
    - Adicionar coluna `subscription_id` para vincular boletos a assinaturas
*/

-- Criar tabela de assinaturas
CREATE TABLE IF NOT EXISTS asas_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  asas_customer_id text,
  asas_subscription_id text UNIQUE,
  value numeric NOT NULL,
  cycle text NOT NULL DEFAULT 'MONTHLY',
  description text NOT NULL,
  next_due_date date,
  status text DEFAULT 'ACTIVE',
  external_reference text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE asas_subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Usuários autenticados podem ler assinaturas"
  ON asas_subscriptions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir assinaturas"
  ON asas_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar assinaturas"
  ON asas_subscriptions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar assinaturas"
  ON asas_subscriptions
  FOR DELETE
  TO authenticated
  USING (true);

-- Adicionar coluna subscription_id na tabela asas_boletos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'asas_boletos' AND column_name = 'subscription_id'
  ) THEN
    ALTER TABLE asas_boletos ADD COLUMN subscription_id uuid REFERENCES asas_subscriptions(id);
  END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_asas_subscriptions_customer_id ON asas_subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_asas_subscriptions_asas_subscription_id ON asas_subscriptions(asas_subscription_id);
CREATE INDEX IF NOT EXISTS idx_asas_boletos_subscription_id ON asas_boletos(subscription_id);