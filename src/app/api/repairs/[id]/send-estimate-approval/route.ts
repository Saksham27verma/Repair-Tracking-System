import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminSupabaseClient } from '@/lib/supabase';
import {
  buildQuoteUpdatesFromDraft,
  validateEstimateApprovalRequest,
} from '@/lib/estimate-approval';
import { sendEmailNotification } from '@/lib/notifications';
import { getRepairApprovalUrl } from '@/lib/app-url';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getAdminSupabaseClient();
    const body = await request.json().catch(() => ({}));

    const draft = {
      manufacturer_estimate:
        body.manufacturer_estimate != null ? Number(body.manufacturer_estimate) : undefined,
      hope_markup: body.hope_markup != null ? Number(body.hope_markup) : undefined,
      email: typeof body.email === 'string' ? body.email.trim() : undefined,
    };

    const { data: repair, error: findError } = await supabase
      .from('repairs')
      .select(
        'id, repair_id, status, patient_name, email, model_item_name, manufacturer_invoice_estimate, estimate_by_us, repair_estimate_by_company, estimate_status'
      )
      .eq('id', params.id)
      .single();

    if (findError || !repair) {
      return NextResponse.json({ error: 'Repair not found' }, { status: 404 });
    }

    const validation = validateEstimateApprovalRequest(repair, draft);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: validation.message,
          missing_fields: validation.missingFields,
          missing_labels: validation.missingLabels,
        },
        { status: 400 }
      );
    }

    const quoteUpdates = buildQuoteUpdatesFromDraft(repair, draft);
    const sentAt = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('repairs')
      .update({
        ...quoteUpdates,
        estimate_approval_request_sent_at: sentAt,
        updated_at: sentAt,
      })
      .eq('id', params.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const email = validation.resolvedEmail!;
    const emailResult = await sendEmailNotification(email, 'estimateApprovalRequest', {
      repairId: repair.repair_id,
      customerName: repair.patient_name,
      estimate: validation.resolvedCustomerQuote,
      productName: repair.model_item_name || 'your device',
      approvalUrl: getRepairApprovalUrl(repair.repair_id, request),
    });

    if (!emailResult.success) {
      return NextResponse.json(
        {
          error: emailResult.error || 'Failed to send approval request email',
        },
        { status: 500 }
      );
    }

    revalidatePath(`/repairs/${repair.repair_id}`);
    revalidatePath(`/dashboard/repairs/${params.id}`);
    revalidatePath('/dashboard/repairs');

    return NextResponse.json({
      success: true,
      message: `Approval request sent to ${email}`,
      estimate_approval_request_sent_at: sentAt,
    });
  } catch (error) {
    console.error('Error sending estimate approval request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
