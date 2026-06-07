import { NextRequest, NextResponse } from 'next/server';
import { getFreshSupabaseClient } from '@/lib/supabase';
import {
  getReceiptTemplateHtml,
  resetReceiptTemplateHtml,
  saveReceiptTemplateHtml,
} from '@/lib/receipt/get-receipt-template';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    if (request.nextUrl.searchParams.get('sampleRepair') === '1') {
      const supabase = getFreshSupabaseClient();
      const { data } = await supabase
        .from('repairs')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return NextResponse.json({ repairId: data?.id || null });
    }

    const html = await getReceiptTemplateHtml();
    return NextResponse.json({ html });
  } catch (error) {
    console.error('Error loading receipt template:', error);
    return NextResponse.json({ error: 'Failed to load receipt template' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const html = typeof body.html === 'string' ? body.html.trim() : '';

    if (!html) {
      return NextResponse.json({ error: 'Template HTML is required' }, { status: 400 });
    }

    await saveReceiptTemplateHtml(html);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving receipt template:', error);
    return NextResponse.json({ error: 'Failed to save receipt template' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const html = await resetReceiptTemplateHtml();
    return NextResponse.json({ success: true, html });
  } catch (error) {
    console.error('Error resetting receipt template:', error);
    return NextResponse.json({ error: 'Failed to reset receipt template' }, { status: 500 });
  }
}
