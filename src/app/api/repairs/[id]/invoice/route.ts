import { NextRequest, NextResponse } from 'next/server';
import { getFreshSupabaseClient } from '@/lib/supabase';
import type { CustomerTaxInvoice, RepairRecord } from '@/app/types/database';
import { buildTaxInvoiceHtml } from '@/lib/invoice/build-invoice-html';
import {
  buildInvoiceTaxSnapshot,
  validateRepairForInvoice,
} from '@/lib/invoice/invoice-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getRepairWithCenter(id: string) {
  const supabase = getFreshSupabaseClient();
  const { data: repair, error } = await supabase
    .from('repairs')
    .select(`
      *,
      current_center:centers!repairs_current_center_id_fkey(id, name, address, phone),
      pickup_center:centers!repairs_pickup_center_id_fkey(id, name, address, phone)
    `)
    .eq('id', id)
    .single();

  if (error || !repair) return null;

  let receivingCenter: { name: string; address?: string; phone?: string } | null = null;

  if (repair.receiving_center) {
    const { data: center } = await supabase
      .from('centers')
      .select('name, address, phone')
      .eq('name', repair.receiving_center)
      .maybeSingle();
    receivingCenter = center;
  } else if (repair.current_center_id) {
    const { data: center } = await supabase
      .from('centers')
      .select('name, address, phone')
      .eq('id', repair.current_center_id)
      .maybeSingle();
    receivingCenter = center;
  }

  return { repair: repair as RepairRecord, receivingCenter };
}

async function getInvoiceForRepair(repairId: string): Promise<CustomerTaxInvoice | null> {
  const supabase = getFreshSupabaseClient();
  const { data, error } = await supabase
    .from('customer_tax_invoices')
    .select('*')
    .eq('repair_id', repairId)
    .maybeSingle();

  if (error || !data) return null;
  return data as CustomerTaxInvoice;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getRepairWithCenter(params.id);
    if (!result) {
      return NextResponse.json({ error: 'Repair not found' }, { status: 404 });
    }

    const { repair } = result;
    const existing = await getInvoiceForRepair(repair.id);
    if (existing) {
      return NextResponse.json(
        { error: 'A tax invoice already exists for this repair.', invoice: existing },
        { status: 409 }
      );
    }

    const validation = validateRepairForInvoice(repair);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors.join(' ') }, { status: 400 });
    }

    let invoiceDate = new Date().toISOString().slice(0, 10);
    try {
      const body = await request.json();
      if (body?.invoice_date && /^\d{4}-\d{2}-\d{2}$/.test(body.invoice_date)) {
        invoiceDate = body.invoice_date;
      }
    } catch {
      // empty body is fine
    }

    const supabase = getFreshSupabaseClient();
    const { data: invoiceNumber, error: seqError } = await supabase.rpc('next_tax_invoice_number');

    if (seqError || !invoiceNumber) {
      console.error('Failed to allocate invoice number:', seqError);
      return NextResponse.json({ error: 'Failed to allocate invoice number' }, { status: 500 });
    }

    const taxSnapshot = buildInvoiceTaxSnapshot(validation.grossAmount, validation.gstRate);

    const { data: invoice, error: insertError } = await supabase
      .from('customer_tax_invoices')
      .insert({
        repair_id: repair.id,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        gross_amount: taxSnapshot.gross_amount,
        gst_rate: taxSnapshot.gst_rate,
        net_amount: taxSnapshot.net_amount,
        cgst_amount: taxSnapshot.cgst_amount,
        sgst_amount: taxSnapshot.sgst_amount,
        tax_amount: taxSnapshot.tax_amount,
        payment_mode: repair.payment_mode || null,
        place_of_supply: taxSnapshot.place_of_supply,
        hsn_sac: taxSnapshot.hsn_sac,
      })
      .select('*')
      .single();

    if (insertError || !invoice) {
      console.error('Failed to create invoice:', insertError);
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }

    return NextResponse.json({
      ...(invoice as CustomerTaxInvoice),
      amount_source: validation.amountSource,
    });
  } catch (error) {
    console.error('Error creating tax invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getRepairWithCenter(params.id);
    if (!result) {
      return NextResponse.json({ error: 'Repair not found' }, { status: 404 });
    }

    const invoice = await getInvoiceForRepair(result.repair.id);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not created yet' }, { status: 404 });
    }

    const invoiceInput = {
      invoice,
      repair: result.repair,
      receivingCenter: result.receivingCenter,
    };

    const format = request.nextUrl.searchParams.get('format');
    if (format === 'html') {
      const html = await buildTaxInvoiceHtml(invoiceInput);
      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      });
    }

    const { generateTaxInvoicePdf } = await import('@/lib/invoice/generate-pdf');
    const pdfBuffer = await generateTaxInvoicePdf(invoiceInput);
    const filename = `tax-invoice-${invoice.invoice_number}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error generating tax invoice:', error);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}
