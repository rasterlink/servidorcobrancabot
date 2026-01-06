/*
  # Adicionar campos de controle de lembretes aos boletos

  1. Alterações
    - Adiciona campo `reminder_sent_at` (timestamp) - quando o lembrete de 5 dias antes foi enviado
    - Adiciona campo `last_collection_sent_at` (timestamp) - última vez que foi enviada cobrança após vencimento
    - Adiciona campo `collection_count` (integer) - quantidade de cobranças enviadas após vencimento

  2. Objetivo
    - Controlar o envio de lembretes 5 dias antes do vencimento
    - Controlar o envio de cobranças de 3 em 3 dias após o vencimento
    - Evitar envio duplicado de mensagens
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'asas_boletos' AND column_name = 'reminder_sent_at'
  ) THEN
    ALTER TABLE asas_boletos ADD COLUMN reminder_sent_at timestamptz DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'asas_boletos' AND column_name = 'last_collection_sent_at'
  ) THEN
    ALTER TABLE asas_boletos ADD COLUMN last_collection_sent_at timestamptz DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'asas_boletos' AND column_name = 'collection_count'
  ) THEN
    ALTER TABLE asas_boletos ADD COLUMN collection_count integer DEFAULT 0;
  END IF;
END $$;