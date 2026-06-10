import type { RepairRecord } from '@/app/types/database';
import { calculateTaxFromInclusive } from '@/lib/invoice-tax';
import { INVOICE_DEFAULTS } from './invoice-template.config';

export function resolveInvoiceGrossAmount(repair: Pick<RepairRecord, 'customer_paid' | 'repair_estimate_by_company'>): number {
  const paid = Number(repair.customer_paid) || 0;
  if (paid > 0) return Math.round(paid * 100) / 100;
  const quote = Number(repair.repair_estimate_by_company) || 0;
  return Math.round(quote * 100) / 100;
}

export function resolveInvoiceGstRate(repair: Pick<RepairRecord, 'manufacturer_invoice_gst_rate'>): number {
  return Number(repair.manufacturer_invoice_gst_rate) || 18;
}

export interface InvoiceValidationResult {
  valid: boolean;
  errors: string[];
  grossAmount: number;
  gstRate: number;
  amountSource: 'customer_paid' | 'repair_estimate_by_company' | null;
}

export function validateRepairForInvoice(
  repair: Pick<
    RepairRecord,
    | 'patient_name'
    | 'phone'
    | 'model_item_name'
    | 'serial_no'
    | 'customer_paid'
    | 'repair_estimate_by_company'
    | 'manufacturer_invoice_gst_rate'
    | 'payment_mode'
  >
): InvoiceValidationResult {
  const errors: string[] = [];

  if (!repair.patient_name?.trim()) errors.push('Patient name is required.');
  if (!repair.phone?.trim()) errors.push('Phone number is required.');
  if (!repair.model_item_name?.trim()) errors.push('Device model is required.');
  if (!repair.serial_no?.trim()) errors.push('Serial number is required.');

  const paid = Number(repair.customer_paid) || 0;
  const quote = Number(repair.repair_estimate_by_company) || 0;
  let amountSource: InvoiceValidationResult['amountSource'] = null;

  if (paid > 0) {
    amountSource = 'customer_paid';
  } else if (quote > 0) {
    amountSource = 'repair_estimate_by_company';
  } else {
    errors.push('Invoice amount is required. Enter customer quote or amount paid on the repair.');
  }

  const grossAmount = resolveInvoiceGrossAmount(repair);
  const gstRate = resolveInvoiceGstRate(repair);

  if (grossAmount <= 0) {
    errors.push('Invoice amount must be greater than zero.');
  }

  return {
    valid: errors.length === 0,
    errors,
    grossAmount,
    gstRate,
    amountSource,
  };
}

export function buildInvoiceTaxSnapshot(grossAmount: number, gstRate: number) {
  const breakdown = calculateTaxFromInclusive(grossAmount, gstRate);
  return {
    gross_amount: breakdown.grossValue,
    gst_rate: gstRate,
    net_amount: breakdown.netValue,
    cgst_amount: breakdown.cgstAmount,
    sgst_amount: breakdown.sgstAmount,
    tax_amount: breakdown.taxAmount,
    place_of_supply: INVOICE_DEFAULTS.placeOfSupply,
    hsn_sac: INVOICE_DEFAULTS.hsnSac,
  };
}
