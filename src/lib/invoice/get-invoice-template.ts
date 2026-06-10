import fs from 'fs';
import path from 'path';
import { getFreshSupabaseClient } from '@/lib/supabase';

export const INVOICE_TEMPLATE_KEY = 'tax_invoice_html';

const DEFAULT_TEMPLATE_PATH = path.join(
  process.cwd(),
  'src/lib/invoice/tax-invoice-template.html'
);

const LOCAL_OVERRIDE_PATH = path.join(process.cwd(), 'data/invoice-template.custom.html');

function readDefaultTemplate(): string {
  return fs.readFileSync(DEFAULT_TEMPLATE_PATH, 'utf-8');
}

export async function getInvoiceTemplateHtml(): Promise<string> {
  if (fs.existsSync(LOCAL_OVERRIDE_PATH)) {
    return fs.readFileSync(LOCAL_OVERRIDE_PATH, 'utf-8');
  }

  try {
    const supabase = getFreshSupabaseClient();
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', INVOICE_TEMPLATE_KEY)
      .maybeSingle();

    if (data?.value) {
      return data.value;
    }
  } catch (error) {
    console.warn('Could not load invoice template from database, using default file.', error);
  }

  return readDefaultTemplate();
}

export async function saveInvoiceTemplateHtml(html: string): Promise<void> {
  try {
    const supabase = getFreshSupabaseClient();
    const { error } = await supabase.from('app_settings').upsert(
      {
        key: INVOICE_TEMPLATE_KEY,
        value: html,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );

    if (!error) {
      return;
    }

    console.warn('Could not save invoice template to database, writing local override.', error);
  } catch (error) {
    console.warn('Database unavailable for invoice template save, writing local override.', error);
  }

  const dataDir = path.dirname(LOCAL_OVERRIDE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(LOCAL_OVERRIDE_PATH, html, 'utf-8');
}

export async function resetInvoiceTemplateHtml(): Promise<string> {
  const defaultHtml = readDefaultTemplate();

  try {
    const supabase = getFreshSupabaseClient();
    await supabase.from('app_settings').delete().eq('key', INVOICE_TEMPLATE_KEY);
  } catch {
    // ignore
  }

  if (fs.existsSync(LOCAL_OVERRIDE_PATH)) {
    fs.unlinkSync(LOCAL_OVERRIDE_PATH);
  }

  return defaultHtml;
}
