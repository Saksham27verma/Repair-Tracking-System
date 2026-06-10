import { NextRequest, NextResponse } from 'next/server';
import { getFreshSupabaseClient } from '@/lib/supabase';
import {
  getInvoiceTemplateHtml,
  resetInvoiceTemplateHtml,
  saveInvoiceTemplateHtml,
} from '@/lib/invoice/get-invoice-template';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    if (request.nextUrl.searchParams.get('sampleRepair') === '1') {
      const supabase = getFreshSupabaseClient();
      const { data } = await supabase
        .from('customer_tax_invoices')
        .select('repair_id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return NextResponse.json({ repairId: data?.repair_id || null });
    }

    const html = await getInvoiceTemplateHtml();
    return NextResponse.json({ html });
  } catch (error) {
    console.error('Error loading invoice template:', error);
    return NextResponse.json({ error: 'Failed to load invoice template' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const html = typeof body.html === 'string' ? body.html.trim() : '';

    if (!html) {
      return NextResponse.json({ error: 'Template HTML is required' }, { status: 400 });
    }

    await saveInvoiceTemplateHtml(html);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving invoice template:', error);
    return NextResponse.json({ error: 'Failed to save invoice template' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const html = await resetInvoiceTemplateHtml();
    return NextResponse.json({ success: true, html });
  } catch (error) {
    console.error('Error resetting invoice template:', error);
    return NextResponse.json({ error: 'Failed to reset invoice template' }, { status: 500 });
  }
}
