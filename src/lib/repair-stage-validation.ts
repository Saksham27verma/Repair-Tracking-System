import { MovementType, PaymentMode, RepairRecord, RepairStatus, WarrantyAfterRepair } from '@/app/types/database';
import { calculateTaxFromInclusive } from '@/lib/invoice-tax';
import { isEstimateResolved, requiresPatientEstimate } from '@/lib/estimate-approval';

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
  | 'date_out_to_customer'
  | 'estimate_approval';

type StageValidationInput = Partial<RepairRecord> & {
  receiving_center_id?: string;
  payment_mode?: PaymentMode | null;
  manufacturer_invoice_is_foc?: boolean;
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
  estimate_approval: 'Patient Estimate Approval',
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
    if (
      repair.manufacturer_invoice_total == null ||
      `${repair.manufacturer_invoice_total}` === ''
    ) {
      return true;
    }
    const amount = Number(repair.manufacturer_invoice_total);
    if (!Number.isFinite(amount) || amount < 0) return true;
    if (amount === 0) return !repair.manufacturer_invoice_is_foc;
    return false;
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
  estimate_approval: (repair) =>
    requiresPatientEstimate(repair) && !isEstimateResolved(repair),
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
    'estimate_approval',
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
    'estimate_approval',
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
  'Sent to Company for Repair': ['date_out_to_manufacturer'],
  'Returned from Manufacturer': [
    'manufacturer_invoice_number',
    'manufacturer_invoice_date',
    'manufacturer_invoice_total',
    'warranty_after_repair',
  ],
  'Ready for Pickup': ['pickup_center_id'],
  Completed: ['customer_paid', 'payment_mode', 'date_out_to_customer'],
};

/** Extra blocking checks at specific transitions (already captured on earlier steps) */
const TRANSITION_BLOCKING_FIELDS: Partial<Record<RepairStatus, StageValidationField[]>> = {
  'Ready for Pickup': ['estimate_approval'],
  Completed: ['estimate_approval'],
};

type TransitionValueKey = keyof TransitionFieldValues;

/** Which form values may be written when logging a movement to each status */
const TRANSITION_VALUE_KEYS: Partial<Record<RepairStatus, TransitionValueKey[]>> = {
  'Sent to Company for Repair': ['date_out_to_manufacturer'],
  'Returned from Manufacturer': [
    'manufacturer_invoice_number',
    'manufacturer_invoice_date',
    'manufacturer_invoice_total',
    'manufacturer_invoice_gst_rate',
    'manufacturer_invoice_is_foc',
    'warranty_after_repair',
    'hope_markup',
  ],
  'Ready for Pickup': ['pickup_center_id'],
  Completed: ['customer_paid', 'payment_mode', 'date_out_to_customer'],
};

function shouldApplyTransitionValue(
  key: TransitionValueKey,
  targetStatus?: RepairStatus
): boolean {
  if (!targetStatus) return true;
  const allowed = TRANSITION_VALUE_KEYS[targetStatus];
  return allowed ? allowed.includes(key) : true;
}

export interface TransitionFieldValues {
  date_out_to_manufacturer?: string | null;
  date_out_to_customer?: string | null;
  manufacturer_invoice_number?: string;
  manufacturer_invoice_date?: string | null;
  manufacturer_invoice_total?: number | null;
  manufacturer_invoice_gst_rate?: number;
  manufacturer_invoice_is_foc?: boolean;
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
  values: TransitionFieldValues,
  targetStatus?: RepairStatus
): Record<string, unknown> {
  const updates: Record<string, unknown> = {};

  if (
    shouldApplyTransitionValue('date_out_to_manufacturer', targetStatus) &&
    values.date_out_to_manufacturer !== undefined
  ) {
    updates.date_out_to_manufacturer = values.date_out_to_manufacturer || null;
  }
  if (
    shouldApplyTransitionValue('date_out_to_customer', targetStatus) &&
    values.date_out_to_customer !== undefined
  ) {
    updates.date_out_to_customer = values.date_out_to_customer || null;
  }
  if (
    shouldApplyTransitionValue('manufacturer_invoice_number', targetStatus) &&
    values.manufacturer_invoice_number !== undefined
  ) {
    updates.manufacturer_invoice_number = values.manufacturer_invoice_number || null;
  }
  if (
    shouldApplyTransitionValue('manufacturer_invoice_date', targetStatus) &&
    values.manufacturer_invoice_date !== undefined
  ) {
    updates.manufacturer_invoice_date = values.manufacturer_invoice_date || null;
  }
  if (
    shouldApplyTransitionValue('manufacturer_invoice_total', targetStatus) &&
    values.manufacturer_invoice_total !== undefined
  ) {
    const total =
      values.manufacturer_invoice_total != null && `${values.manufacturer_invoice_total}` !== ''
        ? Number(values.manufacturer_invoice_total)
        : null;
    updates.manufacturer_invoice_total = total;
    const gstRate = Number(values.manufacturer_invoice_gst_rate) || 18;
    updates.manufacturer_invoice_gst_rate = gstRate;
    const isFoc = Boolean(values.manufacturer_invoice_is_foc) && total === 0;
    updates.manufacturer_invoice_is_foc = isFoc;
    if (total != null && total > 0) {
      const breakdown = calculateTaxFromInclusive(total, gstRate);
      updates.manufacturer_invoice_base_amount = breakdown.netValue;
      updates.manufacturer_invoice_tax_amount = breakdown.taxAmount;
      updates.manufacturer_invoice_cgst_amount = breakdown.cgstAmount;
      updates.manufacturer_invoice_sgst_amount = breakdown.sgstAmount;
    } else if (total === 0) {
      updates.manufacturer_invoice_base_amount = null;
      updates.manufacturer_invoice_tax_amount = null;
      updates.manufacturer_invoice_cgst_amount = null;
      updates.manufacturer_invoice_sgst_amount = null;
      if (isFoc && !values.manufacturer_invoice_number?.trim()) {
        updates.manufacturer_invoice_number = 'FOC';
      }
    }
  }
  if (
    shouldApplyTransitionValue('manufacturer_invoice_is_foc', targetStatus) &&
    values.manufacturer_invoice_is_foc !== undefined &&
    values.manufacturer_invoice_total === undefined
  ) {
    updates.manufacturer_invoice_is_foc = values.manufacturer_invoice_is_foc;
  }
  if (
    shouldApplyTransitionValue('warranty_after_repair', targetStatus) &&
    values.warranty_after_repair !== undefined
  ) {
    updates.warranty_after_repair = values.warranty_after_repair || null;
  }
  if (shouldApplyTransitionValue('hope_markup', targetStatus) && values.hope_markup !== undefined) {
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
    } else if (values.manufacturer_invoice_is_foc && invoiceTotal === 0) {
      updates.estimate_status = 'Not Required';
    }
  }
  if (shouldApplyTransitionValue('customer_paid', targetStatus) && values.customer_paid !== undefined) {
    updates.customer_paid =
      values.customer_paid != null && `${values.customer_paid}` !== ''
        ? Number(values.customer_paid)
        : null;
  }
  if (shouldApplyTransitionValue('payment_mode', targetStatus) && values.payment_mode !== undefined) {
    updates.payment_mode = values.payment_mode || null;
  }
  if (shouldApplyTransitionValue('pickup_center_id', targetStatus) && values.pickup_center_id !== undefined) {
    updates.pickup_center_id = values.pickup_center_id || null;
  }

  return updates;
}

export function mapStageFieldErrors(
  result: StageValidationResult,
  values: TransitionFieldValues
): Record<string, string> {
  const errors = result.missingFields.reduce<Record<string, string>>((acc, field) => {
    acc[field] = 'Required for this step';
    return acc;
  }, {});

  if (
    result.missingFields.includes('manufacturer_invoice_total') &&
    values.manufacturer_invoice_total != null &&
    Number(values.manufacturer_invoice_total) === 0
  ) {
    errors.manufacturer_invoice_is_foc =
      'Please confirm this repair was FOC (Free of Cost)';
    delete errors.manufacturer_invoice_total;
  }

  return errors;
}

export function validateTransitionFields(
  targetStatus: RepairStatus,
  values: TransitionFieldValues,
  baseRepair: StageValidationInput = {}
): StageValidationResult {
  const fieldsToCheck = [
    ...getTransitionFieldsForStatus(targetStatus),
    ...(TRANSITION_BLOCKING_FIELDS[targetStatus] || []),
  ];
  const updates = buildRepairUpdatesFromTransition(values, targetStatus);
  const mergedRepair: StageValidationInput = {
    ...baseRepair,
    ...updates,
    status: targetStatus,
  };
  const missingFields = fieldsToCheck.filter((field) => REQUIREMENT_CHECKS[field](mergedRepair));
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
