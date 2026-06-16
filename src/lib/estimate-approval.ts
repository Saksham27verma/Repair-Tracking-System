import { EstimateApprovedBy, EstimateStatus } from '@/app/types/database';

export interface EstimateApprovalContext {
  repair_estimate_by_company?: number | null;
  estimate_status?: EstimateStatus | null;
  estimate_approved_by?: EstimateApprovedBy | null;
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
