import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { EstimateStatus, EstimateApprovedBy } from '@/app/types/database';
import { getFreshSupabaseClient, refreshSchemaCache } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  console.log('⭐ Estimate approval API called');
  
  try {
    // First, refresh the schema cache to ensure we have the latest schema
    await refreshSchemaCache('repairs');
    console.log('✅ Schema cache refreshed');
    
    const body = await request.json();
    const { repairId, status, approvedBy } = body;
    console.log(`📝 Processing approval: repairId=${repairId}, status=${status}, approvedBy=${approvedBy}`);

    if (!repairId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Repair ID is required' 
      }, { status: 400 });
    }

    if (!status || !['Approved', 'Declined', 'Pending', 'Not Required'].includes(status)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Valid status is required (Approved, Declined, Pending, Not Required)' 
      }, { status: 400 });
    }

    const resolvedApprovedBy: EstimateApprovedBy | null =
      status === 'Approved' || status === 'Declined'
        ? approvedBy === 'staff'
          ? 'staff'
          : 'patient'
        : null;

    // Use a fresh Supabase client to avoid cache issues
    const freshSupabase = getFreshSupabaseClient();

    // Find the repair by repair_id
    console.log(`🔍 Looking up repair with repair_id: ${repairId}`);
    const { data: existingRepair, error: findError } = await freshSupabase
      .from('repairs')
      .select(
        'id, status, patient_name, phone, model_item_name, serial_no, warranty, purpose, current_center_id, pickup_center_id, date_out_to_manufacturer, date_received_from_manufacturer, date_out_to_customer, manufacturer_invoice_number, manufacturer_invoice_date, manufacturer_invoice_total, warranty_after_repair, customer_paid, payment_mode, repair_estimate_by_company, estimate_status'
      )
      .eq('repair_id', repairId)
      .single();

    if (findError) {
      console.error('❌ Error finding repair:', findError);
      return NextResponse.json({ 
        success: false, 
        message: `Repair not found: ${findError.message}` 
      }, { status: 404 });
    }

    if (!existingRepair) {
      console.error('❌ Repair not found, no error provided');
      return NextResponse.json({ 
        success: false, 
        message: 'Repair not found' 
      }, { status: 404 });
    }

    console.log(`✅ Found repair with ID: ${existingRepair.id}`);

    // Update object to update the repair - now include the estimate_approval_date since it exists
    const updateData: {
      estimate_status: EstimateStatus;
      estimate_approval_date: string;
      estimate_approved_by: EstimateApprovedBy | null;
    } = {
      estimate_status: status as EstimateStatus,
      estimate_approval_date: new Date().toISOString(),
      estimate_approved_by: resolvedApprovedBy,
    };

    // Declining only records the decision — staff schedules return via Log Movement

    console.log('📝 Update data:', JSON.stringify(updateData));

    // Update the repair with the new status using the fresh client
    console.log(`🔄 Updating repair ID: ${existingRepair.id}`);
    const { error: updateError } = await freshSupabase
      .from('repairs')
      .update(updateData)
      .eq('id', existingRepair.id);

    if (updateError) {
      console.error('❌ Error updating repair:', updateError);
      return NextResponse.json({ 
        success: false, 
        message: `Failed to update estimate status: ${updateError.message}` 
      }, { status: 500 });
    }

    console.log('✅ Repair updated successfully');

    // Revalidate the repair page
    console.log('🔄 Revalidating paths...');
    revalidatePath(`/repairs/${repairId}`);
    revalidatePath(`/dashboard/repairs/${existingRepair.id}`);
    revalidatePath('/dashboard/repairs');

    // Also try to invalidate cache through our dedicated endpoint
    try {
      console.log('🔄 Calling cache invalidation API...');
      await fetch(`${request.nextUrl.origin}/api/cache-invalidate?repair_id=${repairId}&id=${existingRepair.id}`, {
        method: 'POST',
        cache: 'no-store',
      });
    } catch (cacheError) {
      console.warn('⚠️ Failed to invalidate cache via API:', cacheError);
    }

    return NextResponse.json({ 
      success: true, 
      message: status === 'Approved' 
        ? resolvedApprovedBy === 'staff'
          ? 'Estimate approved on behalf of patient. Recorded as confirmed by Hearing Hope.'
          : 'Estimate approved. Your repair will proceed.'
        : resolvedApprovedBy === 'staff'
          ? 'Estimate declined on behalf of patient. Schedule return from manufacturer without repair.'
          : 'Estimate declined. We will arrange to return your device without repair.'
    });
  } catch (error) {
    console.error('❌ Unexpected error in estimate approval:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'An error occurred while processing the estimate approval' 
    }, { status: 500 });
  }
} 