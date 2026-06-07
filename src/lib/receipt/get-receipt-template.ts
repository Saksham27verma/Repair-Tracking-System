import fs from 'fs';
import path from 'path';
import { getFreshSupabaseClient } from '@/lib/supabase';
import { RECEIPT_TEMPLATE_KEY } from './receipt-template.config';

const DEFAULT_TEMPLATE_PATH = path.join(
  process.cwd(),
  'src/lib/receipt/receipt-template.html'
);

const LOCAL_OVERRIDE_PATH = path.join(process.cwd(), 'data/receipt-template.custom.html');

function readDefaultTemplate(): string {
  return fs.readFileSync(DEFAULT_TEMPLATE_PATH, 'utf-8');
}

export async function getReceiptTemplateHtml(): Promise<string> {
  if (fs.existsSync(LOCAL_OVERRIDE_PATH)) {
    return fs.readFileSync(LOCAL_OVERRIDE_PATH, 'utf-8');
  }

  try {
    const supabase = getFreshSupabaseClient();
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', RECEIPT_TEMPLATE_KEY)
      .maybeSingle();

    if (data?.value) {
      return data.value;
    }
  } catch (error) {
    console.warn('Could not load receipt template from database, using default file.', error);
  }

  return readDefaultTemplate();
}

export async function saveReceiptTemplateHtml(html: string): Promise<void> {
  try {
    const supabase = getFreshSupabaseClient();
    const { error } = await supabase.from('app_settings').upsert(
      {
        key: RECEIPT_TEMPLATE_KEY,
        value: html,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );

    if (!error) {
      return;
    }

    console.warn('Could not save receipt template to database, writing local override.', error);
  } catch (error) {
    console.warn('Database unavailable for receipt template save, writing local override.', error);
  }

  const dataDir = path.dirname(LOCAL_OVERRIDE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(LOCAL_OVERRIDE_PATH, html, 'utf-8');
}

export async function resetReceiptTemplateHtml(): Promise<string> {
  const defaultHtml = readDefaultTemplate();

  try {
    const supabase = getFreshSupabaseClient();
    await supabase.from('app_settings').delete().eq('key', RECEIPT_TEMPLATE_KEY);
  } catch {
    // ignore database reset errors
  }

  if (fs.existsSync(LOCAL_OVERRIDE_PATH)) {
    fs.unlinkSync(LOCAL_OVERRIDE_PATH);
  }

  return defaultHtml;
}
