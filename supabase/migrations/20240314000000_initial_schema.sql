-- Create enum types
CREATE TYPE repair_status AS ENUM (
  'Received',
  'Sent to Manufacturer',
  'Returned from Manufacturer',
  'Ready for Pickup',
  'Completed'
);

CREATE TYPE warranty_status AS ENUM (
  'In Warranty',
  'Out of Warranty',
  'Extended Warranty'
);

CREATE TYPE payment_mode AS ENUM (
  'Cash',
  'Card',
  'UPI',
  'Bank Transfer'
);

-- Create customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  company TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create repairs table
CREATE TABLE repairs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repair_id TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id),
  status repair_status NOT NULL DEFAULT 'Received',
  
  -- Customer Information
  patient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  company TEXT,
  
  -- Product Information
  product_name TEXT NOT NULL,
  model_item_name TEXT NOT NULL,
  serial_no TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  warranty warranty_status NOT NULL,
  foc TEXT NOT NULL, -- Field of Concern
  purpose TEXT NOT NULL,
  
  -- Dates
  date_of_receipt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  date_out_to_manufacturer TIMESTAMPTZ,
  date_received_from_manufacturer TIMESTAMPTZ,
  date_out_to_customer TIMESTAMPTZ,
  
  -- Financial Information
  repair_estimate_by_company DECIMAL(10,2),
  estimate_by_us DECIMAL(10,2),
  customer_paid DECIMAL(10,2),
  payment_mode payment_mode,
  
  -- Additional Information
  programming_done BOOLEAN DEFAULT FALSE,
  remarks TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX repairs_repair_id_idx ON repairs(repair_id);
CREATE INDEX repairs_phone_idx ON repairs(phone);
CREATE INDEX repairs_status_idx ON repairs(status);
CREATE INDEX repairs_customer_id_idx ON repairs(customer_id);
CREATE INDEX repairs_created_at_idx ON repairs(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repairs_updated_at
  BEFORE UPDATE ON repairs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Drop existing policies
DROP POLICY IF EXISTS "Allow staff to read customers" ON customers;
DROP POLICY IF EXISTS "Allow staff to insert customers" ON customers;
DROP POLICY IF EXISTS "Allow staff to update customers" ON customers;
DROP POLICY IF EXISTS "Allow staff to read repairs" ON repairs;
DROP POLICY IF EXISTS "Allow staff to insert repairs" ON repairs;
DROP POLICY IF EXISTS "Allow staff to update repairs" ON repairs;
DROP POLICY IF EXISTS "Allow public to read their own repair" ON repairs;

-- Updated Customers policies
CREATE POLICY "Allow all to read customers"
  ON customers FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow all to insert customers"
  ON customers FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all to update customers"
  ON customers FOR UPDATE
  TO anon, authenticated
  USING (true);

-- Updated Repairs policies
CREATE POLICY "Allow all to read repairs"
  ON repairs FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow all to insert repairs"
  ON repairs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all to update repairs"
  ON repairs FOR UPDATE
  TO anon, authenticated
  USING (true); 