import { NextRequest, NextResponse } from 'next/server';
import { getFreshSupabaseClient } from '@/lib/supabase';
import { buildRepairReceiptHtml } from '@/lib/receipt/build-receipt-html';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getRepairForReceipt(id: string) {
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

  return { repair, receivingCenter };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getRepairForReceipt(params.id);

    if (!result) {
      return NextResponse.json({ error: 'Repair not found' }, { status: 404 });
    }

    const receiptInput = {
      repair: result.repair,
      receivingCenter: result.receivingCenter,
    };

    const format = request.nextUrl.searchParams.get('format');
    if (format === 'html') {
      const html = await buildRepairReceiptHtml(receiptInput);
      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      });
    }

    const { generateRepairReceiptPdf } = await import('@/lib/receipt/generate-pdf');
    const pdfBuffer = await generateRepairReceiptPdf(receiptInput);

    const filename = `drop-off-receipt-${result.repair.repair_id}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error generating repair receipt:', error);
    return NextResponse.json({ error: 'Failed to generate receipt' }, { status: 500 });
  }
}
