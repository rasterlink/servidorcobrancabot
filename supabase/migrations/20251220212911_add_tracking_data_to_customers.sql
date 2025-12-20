/*
  # Adiciona campos de rastreamento à tabela customers

  1. Mudanças
    - Adiciona coluna `raw_data` (JSONB) para armazenar todos os dados da planilha de rastreamento
    - Adiciona colunas específicas para os campos mais usados:
      - `vehicle_plate` - Placa do veículo
      - `vehicle_chassis` - Chassi do veículo
      - `vehicle_brand` - Marca do veículo
      - `vehicle_model` - Modelo do veículo
      - `document` - CNPJ/CPF do cliente
      - `contract_status` - Status do contrato (ATIVO, INATIVO, etc)
      - `overdue_installments` - Número de parcelas vencidas
      - `tracker_id` - ID do rastreador
      - `renewal_status` - Status de renovação
      - `contract_renewal` - Tipo de renovação (CONTRATO VIGENTE, etc)
      - `installation_date` - Data de instalação
      - `validity_date` - Data de vigência
      - `seller` - Nome do vendedor
      - `total_value` - Valor total
      - `installment_value` - Valor da parcela
  
  2. Notas
    - O campo `raw_data` armazena TODOS os dados originais da planilha
    - Os campos específicos facilitam consultas e filtros
    - Dados existentes não são afetados
*/

-- Adiciona coluna raw_data para armazenar todos os dados originais
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'raw_data'
  ) THEN
    ALTER TABLE customers ADD COLUMN raw_data JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Adiciona colunas específicas para campos mais usados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'vehicle_plate'
  ) THEN
    ALTER TABLE customers ADD COLUMN vehicle_plate TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'vehicle_chassis'
  ) THEN
    ALTER TABLE customers ADD COLUMN vehicle_chassis TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'vehicle_brand'
  ) THEN
    ALTER TABLE customers ADD COLUMN vehicle_brand TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'vehicle_model'
  ) THEN
    ALTER TABLE customers ADD COLUMN vehicle_model TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'document'
  ) THEN
    ALTER TABLE customers ADD COLUMN document TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'contract_status'
  ) THEN
    ALTER TABLE customers ADD COLUMN contract_status TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'overdue_installments'
  ) THEN
    ALTER TABLE customers ADD COLUMN overdue_installments INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'tracker_id'
  ) THEN
    ALTER TABLE customers ADD COLUMN tracker_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'renewal_status'
  ) THEN
    ALTER TABLE customers ADD COLUMN renewal_status TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'contract_renewal'
  ) THEN
    ALTER TABLE customers ADD COLUMN contract_renewal TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'installation_date'
  ) THEN
    ALTER TABLE customers ADD COLUMN installation_date DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'validity_date'
  ) THEN
    ALTER TABLE customers ADD COLUMN validity_date DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'seller'
  ) THEN
    ALTER TABLE customers ADD COLUMN seller TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'total_value'
  ) THEN
    ALTER TABLE customers ADD COLUMN total_value NUMERIC;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'installment_value'
  ) THEN
    ALTER TABLE customers ADD COLUMN installment_value NUMERIC;
  END IF;
END $$;

-- Cria índices para melhorar performance de busca
CREATE INDEX IF NOT EXISTS idx_customers_vehicle_plate ON customers(vehicle_plate);
CREATE INDEX IF NOT EXISTS idx_customers_document ON customers(document);
CREATE INDEX IF NOT EXISTS idx_customers_contract_status ON customers(contract_status);
CREATE INDEX IF NOT EXISTS idx_customers_raw_data ON customers USING GIN(raw_data);
