import { MovementType, PaymentMode, RepairRecord, RepairStatus, WarrantyAfterRepair } from '@/app/types/database';
import { calculateTaxFromInclusive } from '@/lib/invoice-tax';

type StageValidationField =
  | 'patient_name'
  | 'phone'
  | 'model_item_name'
  | 'serial_no'
  | 'warranty'
  | 'purpose'
  | 'receiving_center_id'
  | 'date_out_to_manufacturer'
  | 'manufacturer_invoice_number'
  | 'manufacturer_invoice_date'
  | 'manufacturer_invoice_total'
  | 'warranty_after_repair'
  | 'pickup_center_id'
  | 'customer_paid'
  | 'payment_mode'
  | 'date_out_to_customer';

type StageValidationInput = Partial<RepairRecord> & {
  receiving_center_id?: string;
  payment_mode?: PaymentMode | null;
};

type RequirementFn = (repair: StageValidationInput) => boolean;

interface StageValidationResult {
  isValid: boolean;
  missingFields: StageValidationField[];
  missingLabels: string[];
  message: string | null;
}

const FIELD_LABELS: Record<StageValidationField, string> = {
  patient_name: 'Patient Name',
  phone: 'Phone',
  model_item_name: 'Model / Item Name',
  serial_no: 'Serial Number',
  warranty: 'Warranty Status',
  purpose: 'Purpose',
  receiving_center_id: 'Receiving Center',
  date_out_to_manufacturer: 'Date Sent to Manufacturer',
  manufacturer_invoice_number: 'Manufacturer Invoice Number',
  manufacturer_invoice_date: 'Manufacturer Invoice Date',
  manufacturer_invoice_total: 'Manufacturer Invoice Total',
  warranty_after_repair: 'Warranty After Repair',
  pickup_center_id: 'Pickup Center',
  customer_paid: 'Amount Customer Paid',
  payment_mode: 'Payment Mode',
  date_out_to_customer: 'Completion Date',
};

const REQUIREMENT_CHECKS: Record<StageValidationField, RequirementFn> = {
  patient_name: (repair) => !repair.patient_name?.trim(),
  phone: (repair) => !repair.phone?.trim() || repair.phone.trim().length < 10,
  model_item_name: (repair) => !repair.model_item_name?.trim(),
  serial_no: (repair) => !repair.serial_no?.trim(),
  warranty: (repair) => !repair.warranty,
  purpose: (repair) => !repair.purpose?.trim(),
  receiving_center_id: (repair) =>
    !repair.receiving_center_id?.trim() && !repair.current_center_id?.trim(),
  date_out_to_manufacturer: (repair) => !repair.date_out_to_manufacturer,
  manufacturer_invoice_number: (repair) => !repair.manufacturer_invoice_number?.trim(),
  manufacturer_invoice_date: (repair) => !repair.manufacturer_invoice_date,
  manufacturer_invoice_total: (repair) => {
    const amount = Number(repair.manufacturer_invoice_total);
    return !Number.isFinite(amount) || amount <= 0;
  },
  warranty_after_repair: (repair) => !repair.warranty_after_repair,
  pickup_center_id: (repair) =>
    !repair.pickup_center_id?.trim() &&
    !repair.current_center_id?.trim() &&
    !repair.receiving_center_id?.trim(),
  customer_paid: (repair) => {
    const amount = Number(repair.customer_paid);
    return !Number.isFinite(amount) || amount <= 0;
  },
  payment_mode: (repair) => !repair.payment_mode,
  date_out_to_customer: (repair) => !repair.date_out_to_customer,
};

export const STATUS_REQUIRED_FIELDS: Record<RepairStatus, StageValidationField[]> = {
  Received: [
    'patient_name',
    'phone',
    'model_item_name',
    'serial_no',
    'warranty',
    'purpose',
    'receiving_center_id',
  ],
  'Sent to Company for Repair': [
    'patient_name',
    'phone',
    'model_item_name',
    'serial_no',
    'warranty',
    'purpose',
    'receiving_center_id',
    'date_out_to_manufacturer',
  ],
  'Returned from Manufacturer': [
    'patient_name',
    'phone',
    'model_item_name',
    'serial_no',
    'warranty',
    'purpose',
    'receiving_center_id',
    'date_out_to_manufacturer',
    'manufacturer_invoice_number',
    'manufacturer_invoice_date',
    'manufacturer_invoice_total',
    'warranty_after_repair',
  ],
  'Ready for Pickup': [
    'patient_name',
    'phone',
    'model_item_name',
    'serial_no',
    'warranty',
    'purpose',
    'receiving_center_id',
    'date_out_to_manufacturer',
    'manufacturer_invoice_number',
    'manufacturer_invoice_date',
    'manufacturer_invoice_total',
    'warranty_after_repair',
    'pickup_center_id',
  ],
  Completed: [
    'patient_name',
    'phone',
    'model_item_name',
    'serial_no',
    'warranty',
    'purpose',
    'receiving_center_id',
    'date_out_to_manufacturer',
    'manufacturer_invoice_number',
    'manufacturer_invoice_date',
    'manufacturer_invoice_total',
    'warranty_after_repair',
    'pickup_center_id',
    'customer_paid',
    'payment_mode',
    'date_out_to_customer',
  ],
};

export const MOVEMENT_TO_STATUS: Partial<Record<MovementType, RepairStatus>> = {
  sent_to_manufacturer: 'Sent to Company for Repair',
  returned_from_manufacturer: 'Returned from Manufacturer',
  ready_for_pickup: 'Ready for Pickup',
  delivered: 'Completed',
};

/** Fields users should fill inline at each stage transition */
export const TRANSITION_INPUT_FIELDS: Partial<Record<RepairStatus, StageValidationField[]>> = {
  'Returned from Manufacturer': [
    'manufacturer_invoice_number',
    'manufacturer_invoice_date',
    'manufacturer_invoice_total',
    'warranty_after_repair',
  ],
  'Ready for Pickup': ['pickup_center_id'],
  Completed: ['customer_paid', 'payment_mode'],
};

export interface TransitionFieldValues {
  manufacturer_invoice_number?: string;
  manufacturer_invoice_date?: string | null;
  manufacturer_invoice_total?: number | null;
  manufacturer_invoice_gst_rate?: number;
  warranty_after_repair?: WarrantyAfterRepair | '';
  hope_markup?: number | null;
  customer_paid?: number | null;
  payment_mode?: PaymentMode | null;
  pickup_center_id?: string;
}

export function getTransitionFieldsForStatus(status: RepairStatus): StageValidationField[] {
  return TRANSITION_INPUT_FIELDS[status] || [];
}

export function getTransitionFieldsForMovement(movementType: MovementType): StageValidationField[] {
  const status = MOVEMENT_TO_STATUS[movementType];
  return status ? getTransitionFieldsForStatus(status) : [];
}

export function getCustomerQuoteFromTransition(values: TransitionFieldValues): number {
  const invoiceTotal = Number(values.manufacturer_invoice_total) || 0;
  const markup = Number(values.hope_markup) || 0;
  if (invoiceTotal <= 0 && markup <= 0) return 0;
  return Math.round((invoiceTotal + markup) * 100) / 100;
}

export function buildRepairUpdatesFromTransition(
  values: TransitionFieldValues
): Record<string, unknown> {
  const updates: Record<string, unknown> = {};

  if (values.manufacturer_invoice_number !== undefined) {
    updates.manufacturer_invoice_number = values.manufacturer_invoice_number || null;
  }
  if (values.manufacturer_invoice_date !== undefined) {
    updates.manufacturer_invoice_date = values.manufacturer_invoice_date || null;
  }
  if (values.manufacturer_invoice_total !== undefined) {
    const total =
      values.manufacturer_invoice_total != null && `${values.manufacturer_invoice_total}` !== ''
        ? Number(values.manufacturer_invoice_total)
        : null;
    updates.manufacturer_invoice_total = total;
    const gstRate = Number(values.manufacturer_invoice_gst_rate) || 18;
    updates.manufacturer_invoice_gst_rate = gstRate;
    if (total && total > 0) {
      const breakdown = calculateTaxFromInclusive(total, gstRate);
      updates.manufacturer_invoice_base_amount = breakdown.netValue;
      updates.manufacturer_invoice_tax_amount = breakdown.taxAmount;
      updates.manufacturer_invoice_cgst_amount = breakdown.cgstAmount;
      updates.manufacturer_invoice_sgst_amount = breakdown.sgstAmount;
    }
  }
  if (values.warranty_after_repair !== undefined) {
    updates.warranty_after_repair = values.warranty_after_repair || null;
  }
  if (values.hope_markup !== undefined) {
    const markup =
      values.hope_markup != null && `${values.hope_markup}` !== ''
        ? Number(values.hope_markup)
        : null;
    updates.estimate_by_us = markup;
    const invoiceTotal = Number(values.manufacturer_invoice_total) || 0;
    const quote = invoiceTotal + (markup || 0);
    updates.repair_estimate_by_company = quote > 0 ? Math.round(quote * 100) / 100 : null;
    if (quote > 0) {
      updates.estimate_status = 'Pending';
    }
  }
  if (values.customer_paid !== undefined) {
    updates.customer_paid =
      values.customer_paid != null && `${values.customer_paid}` !== ''
        ? Number(values.customer_paid)
        : null;
  }
  if (values.payment_mode !== undefined) {
    updates.payment_mode = values.payment_mode || null;
  }
  if (values.pickup_center_id !== undefined) {
    updates.pickup_center_id = values.pickup_center_id || null;
  }

  return updates;
}

export function validateTransitionFields(
  targetStatus: RepairStatus,
  values: TransitionFieldValues,
  baseRepair: StageValidationInput = {}
): StageValidationResult {
  const updates = buildRepairUpdatesFromTransition(values);
  return validateRepairForStatus(targetStatus, {
    ...baseRepair,
    ...updates,
    status: targetStatus,
  });
}

export function validateRepairForStatus(
  targetStatus: RepairStatus,
  repair: StageValidationInput
): StageValidationResult {
  const requiredFields = STATUS_REQUIRED_FIELDS[targetStatus] || [];
  const missingFields = requiredFields.filter((field) => REQUIREMENT_CHECKS[field](repair));
  const missingLabels = missingFields.map((field) => FIELD_LABELS[field]);

  return {
    isValid: missingFields.length === 0,
    missingFields,
    missingLabels,
    message:
      missingLabels.length > 0
        ? `Complete required fields for ${targetStatus}: ${missingLabels.join(', ')}.`
        : null,
  };
}
