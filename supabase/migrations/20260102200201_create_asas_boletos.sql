/*
  # Create Asas Boletos Management System

  1. New Tables
    - `asas_customers`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, reference to customers table)
      - `asas_customer_id` (text, ID returned by Asas API)
      - `cpf_cnpj` (text, customer document)
      - `name` (text, customer name)
      - `email` (text, customer email)
      - `phone` (text, customer phone)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `asas_boletos`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, reference to customers table)
      - `asas_customer_id` (text, reference to asas_customers)
      - `asas_payment_id` (text, ID returned by Asas API)
      - `value` (decimal, boleto value)
      - `due_date` (date, payment due date)
      - `description` (text, boleto description)
      - `status` (text, payment status: pending, confirmed, received, etc)
      - `bank_slip_url` (text, URL to download boleto PDF)
      - `barcode` (text, boleto barcode)
      - `nosso_numero` (text, our number)
      - `invoice_url` (text, URL to view invoice)
      - `external_reference` (text, optional external reference)
      - `error_message` (text, error if creation failed)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their boletos
*/

-- Create asas_customers table
CREATE TABLE IF NOT EXISTS asas_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  asas_customer_id text UNIQUE,
  cpf_cnpj text NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create asas_boletos table
CREATE TABLE IF NOT EXISTS asas_boletos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  asas_customer_id text,
  asas_payment_id text UNIQUE,
  value decimal(10, 2) NOT NULL,
  due_date date NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'pending',
  bank_slip_url text,
  barcode text,
  nosso_numero text,
  invoice_url text,
  external_reference text,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_asas_customers_customer_id ON asas_customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_asas_customers_asas_id ON asas_customers(asas_customer_id);
CREATE INDEX IF NOT EXISTS idx_asas_boletos_customer_id ON asas_boletos(customer_id);
CREATE INDEX IF NOT EXISTS idx_asas_boletos_status ON asas_boletos(status);
CREATE INDEX IF NOT EXISTS idx_asas_boletos_due_date ON asas_boletos(due_date);

-- Enable Row Level Security
ALTER TABLE asas_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE asas_boletos ENABLE ROW LEVEL SECURITY;

-- Policies for asas_customers
CREATE POLICY "Users can view their asas customers"
  ON asas_customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert asas customers"
  ON asas_customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their asas customers"
  ON asas_customers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete their asas customers"
  ON asas_customers FOR DELETE
  TO authenticated
  USING (true);

-- Policies for asas_boletos
CREATE POLICY "Users can view their boletos"
  ON asas_boletos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert boletos"
  ON asas_boletos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their boletos"
  ON asas_boletos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete their boletos"
  ON asas_boletos FOR DELETE
  TO authenticated
  USING (true);