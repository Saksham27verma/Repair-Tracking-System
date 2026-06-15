import { validateRepairForInvoice } from '@/lib/invoice/invoice-utils';

const baseRepair = {
  patient_name: 'Jane Doe',
  phone: '9876543210',
  model_item_name: 'Signia Pure',
  serial_no: 'SN123',
  customer_paid: 0,
  repair_estimate_by_company: 0,
  manufacturer_invoice_gst_rate: 18,
  payment_mode: 'Cash' as const,
};

describe('validateRepairForInvoice', () => {
  it('allows zero invoice when device is in warranty', () => {
    const result = validateRepairForInvoice({
      ...baseRepair,
      warranty: '2 years warranty',
    });

    expect(result.valid).toBe(true);
    expect(result.requiresZeroAmountConfirmation).toBe(false);
    expect(result.amountSource).toBe('zero_warranty');
    expect(result.grossAmount).toBe(0);
  });

  it('requires confirmation for zero invoice when out of warranty', () => {
    const result = validateRepairForInvoice({
      ...baseRepair,
      warranty: 'Out of warranty',
    });

    expect(result.valid).toBe(false);
    expect(result.requiresZeroAmountConfirmation).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('allows zero invoice out of warranty when FOC is confirmed', () => {
    const result = validateRepairForInvoice(
      {
        ...baseRepair,
        warranty: 'Out of warranty',
      },
      { confirmZeroAmount: true }
    );

    expect(result.valid).toBe(true);
    expect(result.amountSource).toBe('zero_foc');
  });

  it('accepts paid amount as invoice source', () => {
    const result = validateRepairForInvoice({
      ...baseRepair,
      warranty: 'Out of warranty',
      customer_paid: 1500,
    });

    expect(result.valid).toBe(true);
    expect(result.amountSource).toBe('customer_paid');
    expect(result.grossAmount).toBe(1500);
  });
});

describe('formatInvoiceCurrency', () => {
  it('uses Rs. prefix for PDF-safe rendering', async () => {
    const { formatInvoiceCurrency } = await import('@/lib/invoice-tax');
    expect(formatInvoiceCurrency(1500)).toBe('Rs. 1,500.00');
    expect(formatInvoiceCurrency(0)).toBe('Rs. 0.00');
  });
});
