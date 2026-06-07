-- Manufacturer invoice tracking on repairs
ALTER TABLE repairs
  ADD COLUMN IF NOT EXISTS manufacturer_invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS manufacturer_invoice_date DATE,
  ADD COLUMN IF NOT EXISTS manufacturer_invoice_estimate DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS manufacturer_invoice_total DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS manufacturer_invoice_gst_rate DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS manufacturer_invoice_base_amount DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS manufacturer_invoice_tax_amount DECIMAL(10,2);

COMMENT ON COLUMN repairs.manufacturer_invoice_estimate IS 'Estimate/subtotal on manufacturer invoice (pre-tax reference)';
COMMENT ON COLUMN repairs.manufacturer_invoice_total IS 'Invoice total inclusive of GST';
COMMENT ON COLUMN repairs.manufacturer_invoice_base_amount IS 'Taxable base derived from inclusive total';
COMMENT ON COLUMN repairs.manufacturer_invoice_tax_amount IS 'GST amount derived from inclusive total';
