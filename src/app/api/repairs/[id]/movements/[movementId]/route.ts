import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/lib/supabase';
import { deriveRepairStateFromMovements } from '@/lib/tracking';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; movementId: string } }
) {
  try {
    const supabase = getAdminSupabaseClient();

    const { data: movement, error: fetchError } = await supabase
      .from('repair_movements')
      .select('id, repair_id')
      .eq('id', params.movementId)
      .eq('repair_id', params.id)
      .single();

    if (fetchError || !movement) {
      return NextResponse.json({ error: 'Movement not found' }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from('repair_movements')
      .delete()
      .eq('id', params.movementId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    const { data: remainingMovements, error: listError } = await supabase
      .from('repair_movements')
      .select(`
        *,
        from_center:centers!repair_movements_from_center_id_fkey(id, name),
        to_center:centers!repair_movements_to_center_id_fkey(id, name)
      `)
      .eq('repair_id', params.id)
      .order('created_at', { ascending: true });

    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 });
    }

    const repairState = deriveRepairStateFromMovements(remainingMovements || []);
    const now = new Date().toISOString();

    const { data: updatedRepair, error: updateError } = await supabase
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
        date_out_to_manufacturer,
        date_received_from_manufacturer,
        date_out_to_customer,
        current_center:centers!repairs_current_center_id_fkey(id, name),
        pickup_center:centers!repairs_pickup_center_id_fkey(id, name)
      `)
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ repair: updatedRepair });
  } catch (error) {
    console.error('Error deleting movement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
