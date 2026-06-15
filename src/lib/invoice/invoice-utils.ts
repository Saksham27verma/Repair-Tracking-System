import type { RepairRecord, WarrantyStatus } from '@/app/types/database';
import { calculateTaxFromInclusive } from '@/lib/invoice-tax';
import { INVOICE_DEFAULTS } from './invoice-template.config';

export function isDeviceInWarranty(warranty: WarrantyStatus | string | null | undefined): boolean {
  return Boolean(warranty && warranty !== 'Out of warranty');
}

export function resolveInvoiceGrossAmount(repair: Pick<RepairRecord, 'customer_paid' | 'repair_estimate_by_company'>): number {
  const paid = Number(repair.customer_paid) || 0;
  if (paid > 0) return Math.round(paid * 100) / 100;
  const quote = Number(repair.repair_estimate_by_company) || 0;
  return Math.round(quote * 100) / 100;
}

export function resolveInvoiceGstRate(repair: Pick<RepairRecord, 'manufacturer_invoice_gst_rate'>): number {
  return Number(repair.manufacturer_invoice_gst_rate) || 18;
}

export type InvoiceAmountSource =
  | 'customer_paid'
  | 'repair_estimate_by_company'
  | 'zero_warranty'
  | 'zero_foc'
  | null;

export interface InvoiceValidationOptions {
  confirmZeroAmount?: boolean;
}

export interface InvoiceValidationResult {
  valid: boolean;
  errors: string[];
  requiresZeroAmountConfirmation: boolean;
  grossAmount: number;
  gstRate: number;
  amountSource: InvoiceAmountSource;
  isInWarranty: boolean;
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
    | 'warranty'
  >,
  options: InvoiceValidationOptions = {}
): InvoiceValidationResult {
  const errors: string[] = [];

  if (!repair.patient_name?.trim()) errors.push('Patient name is required.');
  if (!repair.phone?.trim()) errors.push('Phone number is required.');
  if (!repair.model_item_name?.trim()) errors.push('Device model is required.');
  if (!repair.serial_no?.trim()) errors.push('Serial number is required.');

  const paid = Number(repair.customer_paid) || 0;
  const quote = Number(repair.repair_estimate_by_company) || 0;
  let amountSource: InvoiceAmountSource = null;

  const grossAmount = resolveInvoiceGrossAmount(repair);
  const gstRate = resolveInvoiceGstRate(repair);
  const isInWarranty = isDeviceInWarranty(repair.warranty);
  let requiresZeroAmountConfirmation = false;

  if (grossAmount > 0) {
    amountSource = paid > 0 ? 'customer_paid' : 'repair_estimate_by_company';
  } else if (isInWarranty) {
    amountSource = 'zero_warranty';
  } else if (options.confirmZeroAmount) {
    amountSource = 'zero_foc';
  } else {
    requiresZeroAmountConfirmation = true;
  }

  const valid = errors.length === 0 && !requiresZeroAmountConfirmation;

  return {
    valid,
    errors,
    requiresZeroAmountConfirmation,
    grossAmount,
    gstRate,
    amountSource,
    isInWarranty,
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
