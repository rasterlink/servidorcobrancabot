/*
  # Add PIX Key to Customers

  1. Changes
    - Add `pix_key` column to `customers` table
    - This column will store the PIX key (can be CPF, CNPJ, email, phone, or random key)
  
  2. Notes
    - Field is optional as not all customers may have PIX
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'pix_key'
  ) THEN
    ALTER TABLE customers ADD COLUMN pix_key text;
  END IF;
END $$;
