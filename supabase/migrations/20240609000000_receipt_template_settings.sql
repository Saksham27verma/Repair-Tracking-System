CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all to read app_settings"
  ON public.app_settings FOR SELECT
  USING (true);

CREATE POLICY "Allow all to write app_settings"
  ON public.app_settings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all to update app_settings"
  ON public.app_settings FOR UPDATE
  USING (true);
