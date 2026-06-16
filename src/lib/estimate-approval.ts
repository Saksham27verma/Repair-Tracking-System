import { EstimateApprovedBy, EstimateStatus, RepairStatus } from '@/app/types/database';

export interface EstimateApprovalContext {
  repair_estimate_by_company?: number | null;
  estimate_status?: EstimateStatus | null;
  estimate_approved_by?: EstimateApprovedBy | null;
}

export type EstimateApprovalRequestField =
  | 'manufacturer_estimate'
  | 'customer_quote'
  | 'patient_email'
  | 'repair_status';

export interface EstimateApprovalRequestDraft {
  manufacturer_estimate?: number | null;
  hope_markup?: number | null;
  email?: string | null;
}

export interface EstimateApprovalRequestContext extends EstimateApprovalContext {
  status?: RepairStatus | null;
  manufacturer_invoice_estimate?: number | null;
  estimate_by_us?: number | null;
  email?: string | null;
}

export interface EstimateApprovalRequestValidation {
  isValid: boolean;
  missingFields: EstimateApprovalRequestField[];
  missingLabels: string[];
  message: string | null;
  resolvedEmail: string | null;
  resolvedManufacturerEstimate: number;
  resolvedCustomerQuote: number;
}

const REQUEST_FIELD_LABELS: Record<EstimateApprovalRequestField, string> = {
  manufacturer_estimate: 'Manufacturer Estimate',
  customer_quote: 'Customer Quote',
  patient_email: 'Patient Email',
  repair_status: 'Repair Status',
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function resolveManufacturerEstimate(
  repair: EstimateApprovalRequestContext,
  draft?: EstimateApprovalRequestDraft
): number {
  if (draft?.manufacturer_estimate != null && `${draft.manufacturer_estimate}` !== '') {
    return Number(draft.manufacturer_estimate) || 0;
  }
  return Number(repair.manufacturer_invoice_estimate) || 0;
}

function resolveHopeMarkup(
  repair: EstimateApprovalRequestContext,
  draft?: EstimateApprovalRequestDraft
): number {
  if (draft?.hope_markup != null && `${draft.hope_markup}` !== '') {
    return Number(draft.hope_markup) || 0;
  }
  return Number(repair.estimate_by_us) || 0;
}

function resolveCustomerQuote(
  repair: EstimateApprovalRequestContext,
  draft?: EstimateApprovalRequestDraft
): number {
  const mfg = resolveManufacturerEstimate(repair, draft);
  const markup = resolveHopeMarkup(repair, draft);
  if (mfg + markup > 0) {
    return Math.round((mfg + markup) * 100) / 100;
  }
  return Number(repair.repair_estimate_by_company) || 0;
}

function resolveEmail(
  repair: EstimateApprovalRequestContext,
  draft?: EstimateApprovalRequestDraft
): string {
  const candidate = draft?.email?.trim() || repair.email?.trim() || '';
  return candidate;
}

/** Validate that a repair is ready to send an estimate approval request email */
export function validateEstimateApprovalRequest(
  repair: EstimateApprovalRequestContext,
  draft?: EstimateApprovalRequestDraft
): EstimateApprovalRequestValidation {
  const missingFields: EstimateApprovalRequestField[] = [];
  const resolvedManufacturerEstimate = resolveManufacturerEstimate(repair, draft);
  const resolvedCustomerQuote = resolveCustomerQuote(repair, draft);
  const resolvedEmail = resolveEmail(repair, draft);

  if (repair.status !== 'Sent to Company for Repair') {
    missingFields.push('repair_status');
  }

  if (repair.estimate_status === 'Approved' || repair.estimate_status === 'Declined') {
    missingFields.push('repair_status');
  }

  if (resolvedManufacturerEstimate <= 0) {
    missingFields.push('manufacturer_estimate');
  }

  if (resolvedCustomerQuote <= 0) {
    missingFields.push('customer_quote');
  }

  if (!resolvedEmail || !isValidEmail(resolvedEmail)) {
    missingFields.push('patient_email');
  }

  const missingLabels = missingFields.map((field) => REQUEST_FIELD_LABELS[field]);

  return {
    isValid: missingFields.length === 0,
    missingFields,
    missingLabels,
    message:
      missingLabels.length > 0
        ? `Complete required details before sending: ${missingLabels.join(', ')}.`
        : null,
    resolvedEmail: resolvedEmail && isValidEmail(resolvedEmail) ? resolvedEmail : null,
    resolvedManufacturerEstimate,
    resolvedCustomerQuote,
  };
}

export function buildQuoteUpdatesFromDraft(
  repair: EstimateApprovalRequestContext,
  draft?: EstimateApprovalRequestDraft
): {
  manufacturer_invoice_estimate: number;
  estimate_by_us: number | null;
  repair_estimate_by_company: number;
  estimate_status: EstimateStatus;
  email?: string;
} {
  const manufacturerEstimate = resolveManufacturerEstimate(repair, draft);
  const markup = resolveHopeMarkup(repair, draft);
  const customerQuote = resolveCustomerQuote(repair, draft);
  const email = resolveEmail(repair, draft);

  return {
    manufacturer_invoice_estimate: manufacturerEstimate,
    estimate_by_us: markup > 0 ? markup : null,
    repair_estimate_by_company: customerQuote,
    estimate_status: 'Pending',
    ...(email && isValidEmail(email) ? { email } : {}),
  };
}

/** A customer quote was generated and requires a decision */
export function requiresPatientEstimate(repair: EstimateApprovalContext): boolean {
  return (repair.repair_estimate_by_company ?? 0) > 0;
}

export function isEstimateApprovalPending(repair: EstimateApprovalContext): boolean {
  return requiresPatientEstimate(repair) && repair.estimate_status === 'Pending';
}

/** Estimate decision is final — approved, declined, or not required */
export function isEstimateResolved(repair: EstimateApprovalContext): boolean {
  if (!requiresPatientEstimate(repair)) return true;
  const status = repair.estimate_status;
  return status === 'Approved' || status === 'Declined' || status === 'Not Required';
}

export function isEstimateDeclined(repair: EstimateApprovalContext): boolean {
  return repair.estimate_status === 'Declined';
}

export function isRepairDiscontinued(repair: EstimateApprovalContext): boolean {
  return isEstimateDeclined(repair);
}

export function getEstimateApprovalLabel(approvedBy?: EstimateApprovedBy | null): string {
  if (approvedBy === 'staff') {
    return 'Approved by Hearing Hope (phone confirmation)';
  }
  if (approvedBy === 'patient') {
    return 'Approved by you';
  }
  return 'Approved';
}

export function getEstimateApprovalPatientMessage(
  status: EstimateStatus,
  approvedBy?: EstimateApprovedBy | null
): string {
  if (status === 'Approved') {
    if (approvedBy === 'staff') {
      return 'Your repair estimate was approved by Hearing Hope on your behalf after confirmation by phone.';
    }
    return 'You approved the repair estimate.';
  }
  if (status === 'Declined') {
    if (approvedBy === 'staff') {
      return 'Your repair estimate was declined by Hearing Hope on your behalf after confirmation by phone.';
    }
    return 'You declined the repair estimate.';
  }
  return '';
}
