-- Customer tax invoices (one per repair, globally numbered)

CREATE TABLE IF NOT EXISTS public.customer_tax_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repair_id UUID NOT NULL UNIQUE REFERENCES public.repairs(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  invoice_date DATE NOT NULL,
  gross_amount DECIMAL(10,2) NOT NULL,
  gst_rate DECIMAL(5,2) NOT NULL,
  net_amount DECIMAL(10,2) NOT NULL,
  cgst_amount DECIMAL(10,2) NOT NULL,
  sgst_amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) NOT NULL,
  payment_mode payment_mode,
  place_of_supply TEXT NOT NULL DEFAULT 'Delhi',
  hsn_sac TEXT NOT NULL DEFAULT '9987',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS customer_tax_invoices_repair_id_idx
  ON public.customer_tax_invoices (repair_id);

CREATE INDEX IF NOT EXISTS customer_tax_invoices_invoice_number_idx
  ON public.customer_tax_invoices (invoice_number);

ALTER TABLE public.customer_tax_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all to read customer_tax_invoices"
  ON public.customer_tax_invoices FOR SELECT
  USING (true);

CREATE POLICY "Allow all to insert customer_tax_invoices"
  ON public.customer_tax_invoices FOR INSERT
  WITH CHECK (true);

-- Global invoice sequence counter
INSERT INTO public.app_settings (key, value)
VALUES ('tax_invoice_sequence', '0')
ON CONFLICT (key) DO NOTHING;

-- Atomically allocate next invoice number: INV-00001, INV-00002, ...
CREATE OR REPLACE FUNCTION public.next_tax_invoice_number()
RETURNS TEXT AS $$
DECLARE
  next_seq INTEGER;
BEGIN
  INSERT INTO public.app_settings (key, value)
  VALUES ('tax_invoice_sequence', '0')
  ON CONFLICT (key) DO NOTHING;

  UPDATE public.app_settings
  SET value = (value::INTEGER + 1)::TEXT,
      updated_at = NOW()
  WHERE key = 'tax_invoice_sequence'
  RETURNING value::INTEGER INTO next_seq;

  RETURN 'INV-' || LPAD(next_seq::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.customer_tax_invoices IS 'Customer-facing GST tax invoices issued by Hearing Hope (one per repair)';
COMMENT ON FUNCTION public.next_tax_invoice_number IS 'Returns next globally unique tax invoice number (INV-00001 format)';
