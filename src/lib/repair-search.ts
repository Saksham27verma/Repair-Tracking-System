import type { PaymentMode, RepairStatus, WarrantyStatus } from '@/app/types/database';

/** Text columns that support ilike in PostgREST */
export const TEXT_SEARCH_FIELDS = [
  'repair_id',
  'patient_name',
  'phone',
  'email',
  'model_item_name',
  'serial_no',
  'serial_no_2',
  'company',
  'purpose',
  'remarks',
  'receiving_center',
  'estimate_status',
  'manufacturer_invoice_number',
  'mould',
  'warranty_after_repair',
] as const;

const REPAIR_STATUS_VALUES: RepairStatus[] = [
  'Received',
  'Sent to Company for Repair',
  'Returned from Manufacturer',
  'Ready for Pickup',
  'Completed',
];

const WARRANTY_VALUES: WarrantyStatus[] = [
  '2 years warranty',
  '3 years warranty',
  '4 years warranty',
  'Out of warranty',
];

const PAYMENT_MODE_VALUES: PaymentMode[] = ['Cash', 'Card', 'UPI', 'Bank Transfer'];

const ENUM_SEARCH_FIELDS: Array<{ field: string; values: string[] }> = [
  { field: 'status', values: REPAIR_STATUS_VALUES },
  { field: 'warranty', values: WARRANTY_VALUES },
  { field: 'payment_mode', values: PAYMENT_MODE_VALUES },
];

export function sanitizeRepairSearchQuery(query: string): string {
  return query.trim().replace(/[,%]/g, ' ').replace(/\s+/g, ' ');
}

function quotePostgrestValue(value: string): string {
  if (/[,\s"]/.test(value)) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return value;
}

function matchingEnumValues(searchQuery: string, values: string[]): string[] {
  const lower = searchQuery.toLowerCase();
  return values.filter((value) => value.toLowerCase().includes(lower));
}

export function buildRepairSearchOrClause(
  searchQuery: string,
  matchingCenterIds: string[] = []
): string {
  const sanitized = sanitizeRepairSearchQuery(searchQuery);
  if (!sanitized) return '';

  const parts: string[] = [];
  const pattern = `%${sanitized}%`;

  TEXT_SEARCH_FIELDS.forEach((field) => {
    parts.push(`${field}.ilike.${pattern}`);
  });

  const digitsOnly = sanitized.replace(/\D/g, '');
  if (digitsOnly.length >= 4 && digitsOnly !== sanitized) {
    parts.push(`phone.ilike.%${digitsOnly}%`);
  }

  ENUM_SEARCH_FIELDS.forEach(({ field, values }) => {
    matchingEnumValues(sanitized, values).forEach((value) => {
      parts.push(`${field}.eq.${quotePostgrestValue(value)}`);
    });
  });

  matchingCenterIds.forEach((centerId) => {
    parts.push(`current_center_id.eq.${centerId}`);
    parts.push(`pickup_center_id.eq.${centerId}`);
  });

  return parts.join(',');
}

/** Client-side fallback matcher for joined/display fields */
export function repairMatchesSearch(
  repair: Record<string, unknown>,
  searchQuery: string
): boolean {
  const sanitized = sanitizeRepairSearchQuery(searchQuery);
  if (!sanitized) return true;

  const haystack = [
    repair.repair_id,
    repair.patient_name,
    repair.phone,
    repair.email,
    repair.model_item_name,
    repair.serial_no,
    repair.serial_no_2,
    repair.company,
    repair.purpose,
    repair.remarks,
    repair.receiving_center,
    repair.status,
    repair.warranty,
    repair.warranty_after_repair,
    repair.mould,
    repair.estimate_status,
    repair.manufacturer_invoice_number,
    repair.payment_mode,
    (repair.current_center as { name?: string } | undefined)?.name,
    (repair.pickup_center as { name?: string } | undefined)?.name,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const lower = sanitized.toLowerCase();
  const digitsOnly = sanitized.replace(/\D/g, '');

  return (
    haystack.includes(lower) ||
    (digitsOnly.length >= 4 && String(repair.phone || '').includes(digitsOnly))
  );
}
