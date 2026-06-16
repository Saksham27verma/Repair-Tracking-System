import {
  validateEstimateApprovalRequest,
  buildQuoteUpdatesFromDraft,
} from '@/lib/estimate-approval';

const baseRepair = {
  status: 'Sent to Company for Repair' as const,
  manufacturer_invoice_estimate: 2500,
  estimate_by_us: 500,
  repair_estimate_by_company: 3000,
  estimate_status: 'Pending' as const,
  email: 'patient@example.com',
};

describe('validateEstimateApprovalRequest', () => {
  it('blocks send when manufacturer estimate is missing', () => {
    const result = validateEstimateApprovalRequest({
      ...baseRepair,
      manufacturer_invoice_estimate: null,
      repair_estimate_by_company: null,
    });

    expect(result.isValid).toBe(false);
    expect(result.missingFields).toContain('manufacturer_estimate');
  });

  it('blocks send when email is missing', () => {
    const result = validateEstimateApprovalRequest({
      ...baseRepair,
      email: null,
    });

    expect(result.isValid).toBe(false);
    expect(result.missingFields).toContain('patient_email');
  });

  it('passes when all fields are present', () => {
    const result = validateEstimateApprovalRequest(baseRepair);

    expect(result.isValid).toBe(true);
    expect(result.missingFields).toHaveLength(0);
    expect(result.resolvedEmail).toBe('patient@example.com');
    expect(result.resolvedCustomerQuote).toBe(3000);
  });

  it('allows markup = 0', () => {
    const result = validateEstimateApprovalRequest(
      {
        ...baseRepair,
        estimate_by_us: null,
        repair_estimate_by_company: 2500,
      },
      { hope_markup: 0 }
    );

    expect(result.isValid).toBe(true);
    expect(result.resolvedCustomerQuote).toBe(2500);
  });

  it('accepts draft values for missing repair fields', () => {
    const result = validateEstimateApprovalRequest(
      {
        status: 'Sent to Company for Repair',
        manufacturer_invoice_estimate: null,
        estimate_by_us: null,
        repair_estimate_by_company: null,
        estimate_status: 'Not Required',
        email: null,
      },
      {
        manufacturer_estimate: 2000,
        hope_markup: 300,
        email: 'new@example.com',
      }
    );

    expect(result.isValid).toBe(true);
    expect(result.resolvedEmail).toBe('new@example.com');
    expect(result.resolvedCustomerQuote).toBe(2300);
  });
});

describe('buildQuoteUpdatesFromDraft', () => {
  it('builds pending quote from draft', () => {
    const updates = buildQuoteUpdatesFromDraft(
      {
        status: 'Sent to Company for Repair',
        manufacturer_invoice_estimate: null,
        estimate_by_us: null,
        repair_estimate_by_company: null,
        email: null,
      },
      {
        manufacturer_estimate: 1800,
        hope_markup: 200,
        email: 'patient@example.com',
      }
    );

    expect(updates).toEqual({
      manufacturer_invoice_estimate: 1800,
      estimate_by_us: 200,
      repair_estimate_by_company: 2000,
      estimate_status: 'Pending',
      email: 'patient@example.com',
    });
  });
});
