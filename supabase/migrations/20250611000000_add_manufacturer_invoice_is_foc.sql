ALTER TABLE public.repairs
  ADD COLUMN IF NOT EXISTS manufacturer_invoice_is_foc BOOLEAN NOT NULL DEFAULT false;
