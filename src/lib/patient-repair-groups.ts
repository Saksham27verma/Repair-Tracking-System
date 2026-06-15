export interface RepairRow {
  id: string;
  repair_id: string;
  customer_id?: string | null;
  patient_name: string;
  phone: string;
  visit_number?: number | null;
  model_item_name: string;
  status: string;
  estimate_status?: string | null;
  date_of_receipt: string;
  created_at: string;
  warranty?: string | null;
  warranty_after_repair?: string | null;
  customer_paid?: number | null;
  receiving_center?: string | null;
  current_location_type?: string | null;
  current_center?: { id: string; name: string } | null;
  pickup_center?: { id: string; name: string } | null;
}

export interface PatientRepairGroupRow {
  id: string;
  groupKey: string;
  customerId: string | null;
  patient_name: string;
  phone: string;
  total_visits: number;
  visit_numbers: string;
  repair_id: string;
  latest_repair_id: string;
  model_item_name: string;
  status: string;
  estimate_status?: string | null;
  date_of_receipt: string;
  created_at: string;
  warranty?: string | null;
  warranty_after_repair?: string | null;
  customer_paid?: number | null;
  receiving_center?: string | null;
  current_location_type?: string | null;
  current_center?: { id: string; name: string } | null;
  pickup_center?: { id: string; name: string } | null;
}

function getPatientGroupKey(repair: RepairRow): string {
  if (repair.customer_id) {
    return `customer:${repair.customer_id}`;
  }

  const phone = repair.phone?.trim();
  if (phone) {
    return `phone:${phone}`;
  }

  return `repair:${repair.id}`;
}

function getRepairSortTime(repair: RepairRow): number {
  const receipt = repair.date_of_receipt ? new Date(repair.date_of_receipt).getTime() : 0;
  const created = repair.created_at ? new Date(repair.created_at).getTime() : 0;
  return Math.max(receipt, created);
}

export function groupRepairsByPatient(repairs: RepairRow[]): PatientRepairGroupRow[] {
  const groups = new Map<string, RepairRow[]>();

  for (const repair of repairs) {
    const key = getPatientGroupKey(repair);
    const existing = groups.get(key) || [];
    existing.push(repair);
    groups.set(key, existing);
  }

  return Array.from(groups.entries()).map(([groupKey, groupRepairs]) => {
    const sorted = [...groupRepairs].sort(
      (a, b) => getRepairSortTime(b) - getRepairSortTime(a)
    );
    const latest = sorted[0];
    const visitNumbers = [...groupRepairs]
      .sort((a, b) => (a.visit_number ?? 0) - (b.visit_number ?? 0))
      .map((repair, index) => repair.visit_number ?? index + 1);

    return {
      id: groupKey,
      groupKey,
      customerId: latest.customer_id ?? null,
      patient_name: latest.patient_name,
      phone: latest.phone,
      total_visits: groupRepairs.length,
      visit_numbers:
        groupRepairs.length > 1
          ? visitNumbers.map((visit) => `V${visit}`).join(', ')
          : `Visit ${visitNumbers[0] ?? 1}`,
      repair_id: latest.repair_id,
      latest_repair_id: latest.id,
      model_item_name: latest.model_item_name,
      status: latest.status,
      estimate_status: latest.estimate_status,
      date_of_receipt: latest.date_of_receipt,
      created_at: latest.created_at,
      warranty: latest.warranty,
      warranty_after_repair: latest.warranty_after_repair,
      customer_paid: latest.customer_paid,
      receiving_center: latest.receiving_center,
      current_location_type: latest.current_location_type,
      current_center: latest.current_center,
      pickup_center: latest.pickup_center,
    };
  });
}
