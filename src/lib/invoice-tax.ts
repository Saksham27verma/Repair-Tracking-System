export const GST_RATE_OPTIONS = [5, 12, 18, 28] as const;
export type GstRate = (typeof GST_RATE_OPTIONS)[number];

export interface InvoiceTaxBreakdown {
  /** Net value (taxable base, ex-GST) */
  netValue: number;
  cgstRate: number;
  sgstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  /** Total GST = CGST + SGST */
  taxAmount: number;
  /** Gross value inclusive of CGST + SGST */
  grossValue: number;
  gstRate: number;
}

export function calculateTaxFromInclusive(
  grossValue: number,
  gstRate: number
): InvoiceTaxBreakdown {
  if (!grossValue || grossValue <= 0 || !gstRate || gstRate < 0) {
    return {
      netValue: 0,
      cgstRate: 0,
      sgstRate: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      taxAmount: 0,
      grossValue: grossValue || 0,
      gstRate: gstRate || 0,
    };
  }

  const cgstRate = gstRate / 2;
  const sgstRate = gstRate / 2;
  const netValue = roundMoney(grossValue / (1 + gstRate / 100));
  const cgstAmount = roundMoney(netValue * (cgstRate / 100));
  const sgstAmount = roundMoney(netValue * (sgstRate / 100));
  const taxAmount = roundMoney(cgstAmount + sgstAmount);
  const roundedGross = roundMoney(netValue + taxAmount);

  return {
    netValue,
    cgstRate,
    sgstRate,
    cgstAmount,
    sgstAmount,
    taxAmount,
    grossValue: roundedGross,
    gstRate,
  };
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return '—';
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
