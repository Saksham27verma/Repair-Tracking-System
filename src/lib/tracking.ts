import {
  CurrentLocationType,
  MovementType,
  LocationType,
  RepairMovement,
  RepairRecord,
  RepairStatus,
  MOVEMENT_TYPE_LABELS,
} from '@/app/types/database';

export interface RepairUpdatePayload {
  status?: RepairStatus;
  current_location_type?: CurrentLocationType;
  current_center?: { id: string; name: string } | null;
  pickup_center?: { id: string; name: string } | null;
}

export interface MovementInput {
  from_location_type?: LocationType;
  from_center_id?: string;
  to_location_type: LocationType;
  to_center_id?: string;
  movement_type: MovementType;
  carrier?: string;
  tracking_number?: string;
  shipped_at?: string;
  expected_arrival?: string;
  received_at?: string;
  notes?: string;
}

export function deriveLocationFromMovement(
  movement: MovementInput
): { current_location_type: CurrentLocationType; current_center_id: string | null } {
  const { movement_type, to_location_type, to_center_id } = movement;

  switch (movement_type) {
    case 'sent_to_manufacturer':
      return { current_location_type: 'at_manufacturer', current_center_id: null };
    case 'delivered':
      return { current_location_type: 'with_customer', current_center_id: null };
    case 'center_transfer':
      if (to_location_type === 'in_transit') {
        return { current_location_type: 'in_transit', current_center_id: null };
      }
      return {
        current_location_type: 'at_center',
        current_center_id: to_center_id || null,
      };
    case 'returned_from_manufacturer':
    case 'received':
    case 'ready_for_pickup':
      return {
        current_location_type: 'at_center',
        current_center_id: to_center_id || null,
      };
    default:
      if (to_location_type === 'manufacturer') {
        return { current_location_type: 'at_manufacturer', current_center_id: null };
      }
      if (to_location_type === 'customer') {
        return { current_location_type: 'with_customer', current_center_id: null };
      }
      if (to_location_type === 'in_transit') {
        return { current_location_type: 'in_transit', current_center_id: null };
      }
      return {
        current_location_type: 'at_center',
        current_center_id: to_center_id || null,
      };
  }
}

export function getLocationLabel(
  locationType?: CurrentLocationType,
  centerName?: string,
  inTransitTo?: string
): string {
  switch (locationType) {
    case 'at_center':
      return centerName ? `At ${centerName}` : 'At Service Center';
    case 'in_transit':
      return inTransitTo ? `In transit to ${inTransitTo}` : 'In Transit';
    case 'at_manufacturer':
      return 'At Manufacturer';
    case 'with_customer':
      return 'With Customer';
    default:
      return 'Location Unknown';
  }
}

export function getMovementLocationName(
  movement: RepairMovement,
  side: 'from' | 'to'
): string {
  if (side === 'from') {
    if (movement.from_location_type === 'customer') return 'Patient';
    if (movement.from_center?.name) return movement.from_center.name;
    if (movement.from_location_type === 'manufacturer') return 'Manufacturer';
    if (movement.from_location_type === 'in_transit') return 'In Transit';
    if (movement.from_location_type === 'center') return 'Service Center';
    return 'Patient';
  }
  if (movement.to_center?.name) return movement.to_center.name;
  if (movement.to_location_type === 'manufacturer') return 'Manufacturer';
  if (movement.to_location_type === 'customer') return 'Customer';
  if (movement.to_location_type === 'in_transit') return 'In Transit';
  return '—';
}

export function buildJourneySummary(movements: RepairMovement[]): string {
  if (!movements.length) return 'No journey recorded yet';
  const sorted = [...movements].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const stops: string[] = [];
  sorted.forEach((m, i) => {
    const from = getMovementLocationName(m, 'from');
    const to = getMovementLocationName(m, 'to');
    if (i === 0) stops.push(from);
    stops.push(to);
  });
  const unique = stops.filter((s, i) => i === 0 || s !== stops[i - 1]);
  return unique.join(' → ');
}

/** Synthesize journey steps from repair dates when movement log is empty */
export function buildLegacyMovements(repair: Partial<RepairRecord>): RepairMovement[] {
  const steps: RepairMovement[] = [];
  const receivingCenter = repair.receiving_center;
  const centerId = repair.current_center_id;
  const pickupName = repair.pickup_center?.name || receivingCenter;

  if (repair.date_of_receipt && receivingCenter) {
    steps.push({
      id: 'legacy-received',
      repair_id: repair.id || '',
      from_location_type: 'customer',
      to_location_type: 'center',
      movement_type: 'received',
      received_at: repair.date_of_receipt,
      created_at: repair.date_of_receipt,
      to_center: repair.current_center
        ? { ...repair.current_center, is_active: true, created_at: '', updated_at: '' }
        : { id: centerId || '', name: receivingCenter, is_active: true, created_at: '', updated_at: '' },
    } as RepairMovement);
  }

  if (repair.date_out_to_manufacturer) {
    steps.push({
      id: 'legacy-to-mfr',
      repair_id: repair.id || '',
      from_location_type: 'center',
      to_location_type: 'manufacturer',
      movement_type: 'sent_to_manufacturer',
      shipped_at: repair.date_out_to_manufacturer,
      created_at: repair.date_out_to_manufacturer,
      from_center: steps[0]?.to_center,
    } as RepairMovement);
  }

  if (repair.date_received_from_manufacturer) {
    steps.push({
      id: 'legacy-from-mfr',
      repair_id: repair.id || '',
      from_location_type: 'manufacturer',
      to_location_type: 'center',
      movement_type: 'returned_from_manufacturer',
      received_at: repair.date_received_from_manufacturer,
      created_at: repair.date_received_from_manufacturer,
      to_center: steps[0]?.to_center,
    } as RepairMovement);
  }

  if (repair.status === 'Ready for Pickup' || repair.status === 'Completed') {
    const readyDate = repair.date_received_from_manufacturer || repair.updated_at || '';
    if (readyDate) {
      steps.push({
        id: 'legacy-ready',
        repair_id: repair.id || '',
        from_location_type: 'center',
        to_location_type: 'center',
        movement_type: 'ready_for_pickup',
        received_at: readyDate,
        created_at: readyDate,
        to_center: {
          id: repair.pickup_center_id || '',
          name: pickupName || receivingCenter || 'Service Center',
          is_active: true,
          created_at: '',
          updated_at: '',
        },
      } as RepairMovement);
    }
  }

  if (repair.date_out_to_customer) {
    steps.push({
      id: 'legacy-delivered',
      repair_id: repair.id || '',
      from_location_type: 'center',
      to_location_type: 'customer',
      movement_type: 'delivered',
      received_at: repair.date_out_to_customer,
      created_at: repair.date_out_to_customer,
      from_center: steps[steps.length - 1]?.to_center,
    } as RepairMovement);
  }

  return steps;
}

/** Map a logged movement to the repair workflow status */
export function getStatusForMovement(movementType: MovementType): RepairStatus | null {
  switch (movementType) {
    case 'received':
      return 'Received';
    case 'sent_to_manufacturer':
      return 'Sent to Company for Repair';
    case 'returned_from_manufacturer':
      return 'Returned from Manufacturer';
    case 'ready_for_pickup':
      return 'Ready for Pickup';
    case 'delivered':
      return 'Completed';
    default:
      return null;
  }
}

/** Date fields to set when a movement is logged */
export function getDateUpdatesForMovement(
  movementType: MovementType,
  timestamp: string
): Partial<Pick<RepairRecord, 'date_out_to_manufacturer' | 'date_received_from_manufacturer' | 'date_out_to_customer'>> {
  switch (movementType) {
    case 'sent_to_manufacturer':
      return { date_out_to_manufacturer: timestamp };
    case 'returned_from_manufacturer':
      return { date_received_from_manufacturer: timestamp };
    case 'delivered':
      return { date_out_to_customer: timestamp };
    default:
      return {};
  }
}

export function getMovementForStatusChange(
  newStatus: string,
  repair: {
    current_center_id?: string;
    pickup_center_id?: string;
    receiving_center_id?: string;
  }
): MovementInput | null {
  const centerId = repair.current_center_id || repair.receiving_center_id;
  switch (newStatus) {
    case 'Sent to Company for Repair':
      return {
        movement_type: 'sent_to_manufacturer',
        from_location_type: 'center',
        from_center_id: centerId,
        to_location_type: 'manufacturer',
      };
    case 'Returned from Manufacturer':
      return {
        movement_type: 'returned_from_manufacturer',
        from_location_type: 'manufacturer',
        to_location_type: 'center',
        to_center_id: centerId,
        received_at: new Date().toISOString(),
      };
    case 'Ready for Pickup':
      return {
        movement_type: 'ready_for_pickup',
        from_location_type: 'center',
        from_center_id: centerId,
        to_location_type: 'center',
        to_center_id: repair.pickup_center_id || centerId,
        received_at: new Date().toISOString(),
      };
    case 'Completed':
      return {
        movement_type: 'delivered',
        from_location_type: 'center',
        from_center_id: repair.pickup_center_id || centerId,
        to_location_type: 'customer',
        received_at: new Date().toISOString(),
      };
    default:
      return null;
  }
}

export { MOVEMENT_TYPE_LABELS };
