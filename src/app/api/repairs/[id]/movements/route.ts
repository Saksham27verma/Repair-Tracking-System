import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient, getFreshSupabaseClient } from '@/lib/supabase';
import {
  deriveLocationFromMovement,
  getDateUpdatesForMovement,
  getStatusForMovement,
  MovementInput,
} from '@/lib/tracking';
import { validateRepairForStatus } from '@/lib/repair-stage-validation';
import { MovementType } from '@/app/types/database';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getFreshSupabaseClient();
    const { data, error } = await supabase
      .from('repair_movements')
      .select(`
        *,
        from_center:centers!repair_movements_from_center_id_fkey(id, name, address, phone),
        to_center:centers!repair_movements_to_center_id_fkey(id, name, address, phone)
      `)
      .eq('repair_id', params.id)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching movements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getAdminSupabaseClient();
    const body = await request.json();

    const movementInput: MovementInput = {
      from_location_type: body.from_location_type,
      from_center_id: body.from_center_id,
      to_location_type: body.to_location_type,
      to_center_id: body.to_center_id,
      movement_type: body.movement_type as MovementType,
      carrier: body.carrier,
      tracking_number: body.tracking_number,
      shipped_at: body.shipped_at,
      expected_arrival: body.expected_arrival,
      received_at: body.received_at,
      notes: body.notes,
    };

    if (!movementInput.movement_type || !movementInput.to_location_type) {
      return NextResponse.json(
        { error: 'movement_type and to_location_type are required' },
        { status: 400 }
      );
    }

    const { data: repair, error: repairError } = await supabase
      .from('repairs')
      .select(
        'id, status, patient_name, phone, model_item_name, serial_no, warranty, purpose, current_center_id, pickup_center_id, current_location_type, date_out_to_manufacturer, date_received_from_manufacturer, date_out_to_customer, manufacturer_invoice_number, manufacturer_invoice_date, manufacturer_invoice_total, warranty_after_repair, customer_paid, payment_mode'
      )
      .eq('id', params.id)
      .single();

    if (repairError || !repair) {
      return NextResponse.json({ error: 'Repair not found' }, { status: 404 });
    }

    const { data: recentMovements } = await supabase
      .from('repair_movements')
      .select('movement_type, to_center_id, from_center_id')
      .eq('repair_id', params.id)
      .order('created_at', { ascending: false })
      .limit(1);

    const lastMovement = recentMovements?.[0];

    // Center transfers can be logged multiple times (hub hops, re-routes, in-transit then received, etc.)
    const repeatableMovementTypes: MovementType[] = ['center_transfer'];
    if (
      movementInput.movement_type === lastMovement?.movement_type &&
      !repeatableMovementTypes.includes(movementInput.movement_type)
    ) {
      return NextResponse.json(
        { error: `This step was already recorded (${movementInput.movement_type.replace(/_/g, ' ')})` },
        { status: 400 }
      );
    }

    if (
      movementInput.movement_type === 'sent_to_manufacturer' &&
      repair.current_location_type === 'at_manufacturer'
    ) {
      return NextResponse.json(
        { error: 'Device is already at the manufacturer' },
        { status: 400 }
      );
    }

    if (
      movementInput.from_location_type === 'center' &&
      !movementInput.from_center_id &&
      repair.current_center_id
    ) {
      movementInput.from_center_id = repair.current_center_id;
    }

    if (movementInput.movement_type === 'sent_to_manufacturer' && !movementInput.from_center_id) {
      const { data: lastCenterStop } = await supabase
        .from('repair_movements')
        .select('to_center_id')
        .eq('repair_id', params.id)
        .in('movement_type', ['received', 'returned_from_manufacturer', 'center_transfer'])
        .not('to_center_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);

      const centerId = lastCenterStop?.[0]?.to_center_id || repair.current_center_id;
      if (centerId) {
        movementInput.from_center_id = centerId;
        movementInput.from_location_type = 'center';
      }
    }

    if (movementInput.from_location_type === 'customer') {
      movementInput.from_center_id = undefined;
    }

    const repairFieldUpdates =
      body.repair_updates && typeof body.repair_updates === 'object'
        ? (body.repair_updates as Record<string, unknown>)
        : {};

    const now = new Date().toISOString();
    const locationUpdate = deriveLocationFromMovement(movementInput);
    const newStatus = getStatusForMovement(movementInput.movement_type);
    const dateUpdates = getDateUpdatesForMovement(
      movementInput.movement_type,
      movementInput.shipped_at || movementInput.received_at || now
    );

    if (newStatus) {
      const validation = validateRepairForStatus(newStatus, {
        ...repair,
        ...repairFieldUpdates,
        ...dateUpdates,
        status: newStatus,
        current_center_id: locationUpdate.current_center_id || repair.current_center_id,
        pickup_center_id:
          movementInput.movement_type === 'ready_for_pickup' && movementInput.to_center_id
            ? movementInput.to_center_id
            : (repairFieldUpdates.pickup_center_id as string | undefined) || repair.pickup_center_id,
      });

      if (!validation.isValid) {
        return NextResponse.json(
          {
            error: validation.message || `Cannot move repair to ${newStatus}`,
            missing_fields: validation.missingFields,
          },
          { status: 400 }
        );
      }
    }

    const { data: movement, error: movementError } = await supabase
      .from('repair_movements')
      .insert({
        repair_id: params.id,
        ...movementInput,
      })
      .select(`
        *,
        from_center:centers!repair_movements_from_center_id_fkey(id, name, address, phone),
        to_center:centers!repair_movements_to_center_id_fkey(id, name, address, phone)
      `)
      .single();

    if (movementError) {
      return NextResponse.json({ error: movementError.message }, { status: 500 });
    }

    const repairUpdate: Record<string, unknown> = {
      current_location_type: locationUpdate.current_location_type,
      current_center_id: locationUpdate.current_center_id,
      updated_at: now,
      ...dateUpdates,
      ...repairFieldUpdates,
    };

    if (newStatus) {
      repairUpdate.status = newStatus;
    }

    if (movementInput.movement_type === 'ready_for_pickup' && movementInput.to_center_id) {
      repairUpdate.pickup_center_id = movementInput.to_center_id;
    }

    const { data: updatedRepair, error: updateError } = await supabase
      .from('repairs')
      .update(repairUpdate)
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

    return NextResponse.json({ movement, repair: updatedRepair });
  } catch (error) {
    console.error('Error creating movement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
