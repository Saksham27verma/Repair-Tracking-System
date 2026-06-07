ALTER TABLE repairs
  ADD COLUMN IF NOT EXISTS manufacturer_invoice_cgst_amount DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS manufacturer_invoice_sgst_amount DECIMAL(10,2);
