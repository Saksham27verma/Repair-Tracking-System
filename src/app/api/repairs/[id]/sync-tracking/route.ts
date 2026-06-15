import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/lib/supabase';
import { deriveRepairStateFromMovements } from '@/lib/tracking';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getAdminSupabaseClient();

    const { data: movements, error: movementsError } = await supabase
      .from('repair_movements')
      .select('*')
      .eq('repair_id', params.id)
      .order('created_at', { ascending: true });

    if (movementsError) {
      return NextResponse.json({ error: movementsError.message }, { status: 500 });
    }

    if (!movements?.length) {
      return NextResponse.json({ synced: false, reason: 'No movements to sync from' });
    }

    const repairState = deriveRepairStateFromMovements(movements);
    const now = new Date().toISOString();

    const { data: repair, error: updateError } = await supabase
      .from('repairs')
      .update({
        status: repairState.status,
        current_location_type: repairState.current_location_type,
        current_center_id: repairState.current_center_id,
        pickup_center_id: repairState.pickup_center_id,
        date_out_to_manufacturer: repairState.date_out_to_manufacturer,
        date_received_from_manufacturer: repairState.date_received_from_manufacturer,
        date_out_to_customer: repairState.date_out_to_customer,
        updated_at: now,
      })
      .eq('id', params.id)
      .select(`
        id,
        status,
        current_location_type,
        current_center_id,
        pickup_center_id,
        current_center:centers!repairs_current_center_id_fkey(id, name),
        pickup_center:centers!repairs_pickup_center_id_fkey(id, name)
      `)
      .single();

    if (updateError || !repair) {
      return NextResponse.json({ error: updateError?.message || 'Sync failed' }, { status: 500 });
    }

    return NextResponse.json({ synced: true, repair });
  } catch (error) {
    console.error('Error syncing repair tracking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
