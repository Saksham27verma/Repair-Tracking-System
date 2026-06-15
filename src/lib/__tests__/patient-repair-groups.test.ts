import { groupRepairsByPatient, type RepairRow } from '@/lib/patient-repair-groups';

function makeRepair(overrides: Partial<RepairRow> & Pick<RepairRow, 'id'>): RepairRow {
  return {
    repair_id: `REP-${overrides.id}`,
    customer_id: 'cust-1',
    patient_name: 'John Doe',
    phone: '9876543210',
    visit_number: 1,
    model_item_name: 'Hearing Aid',
    status: 'Received',
    date_of_receipt: '2024-01-01',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('groupRepairsByPatient', () => {
  it('groups multiple visits for the same customer into one row', () => {
    const grouped = groupRepairsByPatient([
      makeRepair({ id: 'r1', visit_number: 1, repair_id: 'REP-001', date_of_receipt: '2024-01-01' }),
      makeRepair({ id: 'r2', visit_number: 2, repair_id: 'REP-002', date_of_receipt: '2024-06-01' }),
      makeRepair({ id: 'r3', visit_number: 3, repair_id: 'REP-003', date_of_receipt: '2024-12-01' }),
    ]);

    expect(grouped).toHaveLength(1);
    expect(grouped[0].total_visits).toBe(3);
    expect(grouped[0].latest_repair_id).toBe('r3');
    expect(grouped[0].repair_id).toBe('REP-003');
  });

  it('keeps separate patients apart even with the same name', () => {
    const grouped = groupRepairsByPatient([
      makeRepair({ id: 'r1', customer_id: 'cust-1', phone: '1111111111' }),
      makeRepair({ id: 'r2', customer_id: 'cust-2', phone: '2222222222' }),
    ]);

    expect(grouped).toHaveLength(2);
  });

  it('falls back to phone when customer_id is missing', () => {
    const grouped = groupRepairsByPatient([
      makeRepair({ id: 'r1', customer_id: null, phone: '9999999999', visit_number: 1 }),
      makeRepair({ id: 'r2', customer_id: null, phone: '9999999999', visit_number: 2 }),
    ]);

    expect(grouped).toHaveLength(1);
    expect(grouped[0].total_visits).toBe(2);
  });
});
