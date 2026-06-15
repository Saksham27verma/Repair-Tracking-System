import {
  deriveRepairStateFromMovements,
  getEffectiveTrackingState,
} from '@/lib/tracking';
import type { RepairMovement } from '@/app/types/database';

function movement(
  overrides: Partial<RepairMovement> & Pick<RepairMovement, 'movement_type' | 'created_at'>
): RepairMovement {
  return {
    id: overrides.id || 'm1',
    repair_id: 'repair-1',
    from_location_type: 'customer',
    to_location_type: 'center',
    ...overrides,
  } as RepairMovement;
}

describe('getEffectiveTrackingState', () => {
  it('shows at center when only received movement exists', () => {
    const recorded = [
      movement({
        id: 'm1',
        movement_type: 'received',
        created_at: '2024-01-01T00:00:00Z',
        to_center_id: 'center-1',
        to_center: { id: 'center-1', name: 'Rohini', is_active: true, created_at: '', updated_at: '' },
      }),
    ];

    const state = getEffectiveTrackingState(
      {
        status: 'Sent to Company for Repair',
        current_location_type: 'at_center',
        current_center_id: 'center-1',
        current_center: { id: 'center-1', name: 'Rohini' },
      },
      recorded
    );

    expect(state.status).toBe('Received');
    expect(state.locationType).toBe('at_center');
    expect(state.centerName).toBe('Rohini');
    expect(state.isOutOfSync).toBe(true);
    expect(state.syncMessage).toContain('Sent to Company for Repair');
  });

  it('shows at manufacturer after sent movement', () => {
    const recorded = [
      movement({
        id: 'm1',
        movement_type: 'received',
        created_at: '2024-01-01T00:00:00Z',
        to_center_id: 'center-1',
        to_center: { id: 'center-1', name: 'Rohini', is_active: true, created_at: '', updated_at: '' },
      }),
      movement({
        id: 'm2',
        movement_type: 'sent_to_manufacturer',
        created_at: '2024-01-02T00:00:00Z',
        from_location_type: 'center',
        from_center_id: 'center-1',
        to_location_type: 'manufacturer',
      }),
    ];

    const derived = deriveRepairStateFromMovements(recorded);
    expect(derived.status).toBe('Sent to Company for Repair');
    expect(derived.current_location_type).toBe('at_manufacturer');

    const state = getEffectiveTrackingState(
      {
        status: 'Sent to Company for Repair',
        current_location_type: 'at_manufacturer',
      },
      recorded
    );

    expect(state.status).toBe('Sent to Company for Repair');
    expect(state.locationType).toBe('at_manufacturer');
    expect(state.isOutOfSync).toBe(false);
  });
});
