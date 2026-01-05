/*
  # Add installments column to asas_boletos

  1. Changes
    - Add `installment_count` column to `asas_boletos` table
      - Type: integer
      - Default: 1 (single payment)
      - Description: Number of installments for the payment
    
    - Add `installment_number` column to `asas_boletos` table
      - Type: integer
      - Default: 1
      - Description: Current installment number (for tracking multiple installments)

  2. Notes
    - installment_count represents the total number of installments
    - installment_number represents which installment this boleto is (1 of 3, 2 of 3, etc)
    - Default value is 1 for both (single payment, no installments)
*/

-- Add installment columns to asas_boletos table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'asas_boletos' AND column_name = 'installment_count'
  ) THEN
    ALTER TABLE asas_boletos ADD COLUMN installment_count integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'asas_boletos' AND column_name = 'installment_number'
  ) THEN
    ALTER TABLE asas_boletos ADD COLUMN installment_number integer DEFAULT 1;
  END IF;
END $$;

-- Add index for better query performance when filtering by installments
CREATE INDEX IF NOT EXISTS idx_asas_boletos_installments ON asas_boletos(installment_count, installment_number);