import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getAdminSupabaseClient();
    const body = await request.json();
    const manufacturerEstimate = Number(body.manufacturer_estimate);
    const hopeMarkup = Number(body.hope_markup) || 0;

    if (!Number.isFinite(manufacturerEstimate) || manufacturerEstimate < 0) {
      return NextResponse.json(
        { error: 'A valid manufacturer estimate amount is required' },
        { status: 400 }
      );
    }

    const { data: repair, error: findError } = await supabase
      .from('repairs')
      .select('id, repair_id, status, estimate_status')
      .eq('id', params.id)
      .single();

    if (findError || !repair) {
      return NextResponse.json({ error: 'Repair not found' }, { status: 404 });
    }

    if (repair.status !== 'Sent to Company for Repair') {
      return NextResponse.json(
        {
          error:
            'Customer quote can only be set while the device is with the manufacturer (before return).',
        },
        { status: 400 }
      );
    }

    if (repair.estimate_status === 'Approved' || repair.estimate_status === 'Declined') {
      return NextResponse.json(
        { error: 'Estimate has already been decided. Cannot change the quote.' },
        { status: 400 }
      );
    }

    const customerQuote =
      manufacturerEstimate + hopeMarkup > 0
        ? Math.round((manufacturerEstimate + hopeMarkup) * 100) / 100
        : 0;

    const { data: updated, error: updateError } = await supabase
      .from('repairs')
      .update({
        manufacturer_invoice_estimate: manufacturerEstimate,
        estimate_by_us: hopeMarkup > 0 ? hopeMarkup : null,
        repair_estimate_by_company: customerQuote > 0 ? customerQuote : null,
        estimate_status: customerQuote > 0 ? 'Pending' : 'Not Required',
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select('id, repair_id, repair_estimate_by_company, estimate_status')
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    revalidatePath(`/repairs/${repair.repair_id}`);
    revalidatePath(`/dashboard/repairs/${params.id}`);
    revalidatePath('/dashboard/repairs');

    return NextResponse.json({
      success: true,
      repair: updated,
      message:
        customerQuote > 0
          ? 'Customer quote saved. Awaiting patient approval before the device can be returned.'
          : 'Recorded as no charge (FOC).',
    });
  } catch (error) {
    console.error('Error saving estimate quote:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
