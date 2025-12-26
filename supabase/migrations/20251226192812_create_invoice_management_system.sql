/*
  # Invoice Management System

  1. New Tables
    - `customers`
      - `id` (uuid, primary key)
      - `name` (text, customer name)
      - `email` (text, customer email)
      - `phone` (text, customer phone)
      - `cpf_cnpj` (text, CPF or CNPJ)
      - `active` (boolean, customer status)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `invoices`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key to customers)
      - `amount` (numeric, invoice amount)
      - `due_date` (date, payment due date)
      - `status` (text, pending/paid/overdue/cancelled)
      - `barcode` (text, barcode for payment)
      - `pdf_link` (text, link to PDF file)
      - `reference_month` (integer, 1-12)
      - `reference_year` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `sending_history`
      - `id` (uuid, primary key)
      - `invoice_id` (uuid, foreign key to invoices)
      - `sent_at` (timestamptz, when sent)
      - `status` (text, success/failed)
      - `send_type` (text, email/whatsapp/both)
      - `error_message` (text, error details if failed)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (can be restricted later with auth)
*/

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  cpf_cnpj text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to customers"
  ON customers FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to customers"
  ON customers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to customers"
  ON customers FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete to customers"
  ON customers FOR DELETE
  USING (true);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  due_date date NOT NULL,
  status text DEFAULT 'pending',
  barcode text,
  pdf_link text,
  reference_month integer NOT NULL,
  reference_year integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_month CHECK (reference_month >= 1 AND reference_month <= 12),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled'))
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to invoices"
  ON invoices FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to invoices"
  ON invoices FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to invoices"
  ON invoices FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete to invoices"
  ON invoices FOR DELETE
  USING (true);

-- Sending History Table
CREATE TABLE IF NOT EXISTS sending_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  sent_at timestamptz DEFAULT now(),
  status text DEFAULT 'success',
  send_type text NOT NULL,
  error_message text,
  CONSTRAINT valid_send_status CHECK (status IN ('success', 'failed')),
  CONSTRAINT valid_send_type CHECK (send_type IN ('email', 'whatsapp', 'both'))
);

ALTER TABLE sending_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to sending_history"
  ON sending_history FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to sending_history"
  ON sending_history FOR INSERT
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_sending_history_invoice_id ON sending_history(invoice_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();