/*
  # Add Vehicle and Contract Information Fields

  1. Changes to customers table
    - Add `contract_number` (text) - Número do contrato Rasterlink
    - Add `vehicle_plate` (text) - Placa do veículo
    - Add `vehicle_chassis` (text) - Chassi do veículo
    - Add `vehicle_brand` (text) - Marca do veículo
    - Add `vehicle_model` (text) - Modelo do veículo
  
  2. Notes
    - These fields will be included in boleto descriptions
    - Fields are optional to maintain compatibility with existing data
*/

-- Add vehicle and contract fields to customers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'contract_number'
  ) THEN
    ALTER TABLE customers ADD COLUMN contract_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'vehicle_plate'
  ) THEN
    ALTER TABLE customers ADD COLUMN vehicle_plate text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'vehicle_chassis'
  ) THEN
    ALTER TABLE customers ADD COLUMN vehicle_chassis text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'vehicle_brand'
  ) THEN
    ALTER TABLE customers ADD COLUMN vehicle_brand text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'vehicle_model'
  ) THEN
    ALTER TABLE customers ADD COLUMN vehicle_model text;
  END IF;
END $$;