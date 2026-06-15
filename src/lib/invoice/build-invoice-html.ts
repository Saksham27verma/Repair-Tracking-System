import { formatInvoiceCurrency, isZeroInvoiceAmount } from '@/lib/invoice-tax';
import type { CustomerTaxInvoice, RepairRecord, Center } from '@/app/types/database';
import { COMPANY_CONFIG } from '@/lib/receipt/receipt-template.config';
import { getReceiptLogoDataUri } from '@/lib/receipt/logo';
import { INVOICE_DEFAULTS, amountInWords } from './invoice-template.config';
import { buildLineItemDescription } from './invoice-description';
import { getInvoiceTemplateHtml } from './get-invoice-template';

export interface BuildInvoiceHtmlInput {
  invoice: CustomerTaxInvoice;
  repair: RepairRecord & {
    current_center?: Pick<Center, 'id' | 'name' | 'address' | 'phone'>;
    pickup_center?: Pick<Center, 'id' | 'name' | 'address' | 'phone'>;
  };
  receivingCenter?: Pick<Center, 'name' | 'address' | 'phone'> | null;
}

function escapeHtml(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatInvoiceDate(date: string | null | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function replaceAll(template: string, replacements: Record<string, string>): string {
  return Object.entries(replacements).reduce(
    (html, [key, value]) => html.replaceAll(`{{${key}}}`, value),
    template
  );
}

function formatInvoiceAmount(amount: number | null | undefined): string {
  if (isZeroInvoiceAmount(amount)) return 'Nil';
  return formatInvoiceCurrency(amount);
}

function buildLineItems(
  repair: BuildInvoiceHtmlInput['repair'],
  invoice: CustomerTaxInvoice
): string {
  const description = buildLineItemDescription(repair);
  return `
    <tr>
      <td>1</td>
      <td>
        <div class="item-desc">${escapeHtml(description)}</div>
      </td>
      <td>${escapeHtml(invoice.hsn_sac)}</td>
      <td>1</td>
      <td class="amount">${escapeHtml(formatInvoiceAmount(invoice.net_amount))}</td>
      <td class="amount" style="font-weight: 700;">${escapeHtml(formatInvoiceAmount(invoice.gross_amount))}</td>
    </tr>
  `;
}

function buildPaymentSection(invoice: CustomerTaxInvoice): string {
  if (!invoice.payment_mode || isZeroInvoiceAmount(invoice.gross_amount)) return '';
  return `
    <div class="payment-box">
      <strong>Payment Received:</strong> ${escapeHtml(formatInvoiceCurrency(invoice.gross_amount))}
      via ${escapeHtml(invoice.payment_mode)}
    </div>
  `;
}

function buildFocSection(grossAmount: number): string {
  if (!isZeroInvoiceAmount(grossAmount)) return '';
  return `
    <div class="foc-note">
      <strong>No charge to customer.</strong> This invoice is issued at zero value (warranty / FOC repair).
      GST is not applicable on a nil-value supply.
    </div>
  `;
}

export async function buildTaxInvoiceHtml(input: BuildInvoiceHtmlInput): Promise<string> {
  const { invoice, repair, receivingCenter } = input;
  const template = await getInvoiceTemplateHtml();
  const logoSrc = await getReceiptLogoDataUri();

  const centerName =
    receivingCenter?.name || repair.receiving_center || repair.current_center?.name || '-';

  const buyerContact = [
    repair.email ? escapeHtml(repair.email) : null,
    `<strong>Phone:</strong> ${escapeHtml(repair.phone)}`,
  ]
    .filter(Boolean)
    .join(' | ');

  const cgstRate = invoice.gst_rate / 2;
  const sgstRate = invoice.gst_rate / 2;

  return replaceAll(template, {
    LOGO_SRC: logoSrc,
    COMPANY_NAME: escapeHtml(COMPANY_CONFIG.legalName),
    COMPANY_ADDRESS: escapeHtml(COMPANY_CONFIG.address),
    COMPANY_PHONE: escapeHtml(COMPANY_CONFIG.phone),
    COMPANY_WEBSITE: escapeHtml(COMPANY_CONFIG.website),
    COMPANY_GSTIN: escapeHtml(COMPANY_CONFIG.gstin),
    COMPANY_STATE: escapeHtml(COMPANY_CONFIG.state),
    COMPANY_STATE_CODE: escapeHtml(COMPANY_CONFIG.stateCode),
    DOCUMENT_TYPE: escapeHtml(INVOICE_DEFAULTS.documentType),
    INVOICE_NUMBER: escapeHtml(invoice.invoice_number),
    INVOICE_DATE: escapeHtml(formatInvoiceDate(invoice.invoice_date)),
    REPAIR_ID: escapeHtml(repair.repair_id),
    PLACE_OF_SUPPLY: escapeHtml(invoice.place_of_supply),
    BUYER_NAME: escapeHtml(repair.patient_name),
    BUYER_CONTACT: buyerContact,
    RECEIVING_CENTER: escapeHtml(centerName),
    FOC_SECTION: buildFocSection(invoice.gross_amount),
    LINE_ITEMS: buildLineItems(repair, invoice),
    CGST_RATE: escapeHtml(cgstRate),
    SGST_RATE: escapeHtml(sgstRate),
    NET_AMOUNT: escapeHtml(formatInvoiceAmount(invoice.net_amount)),
    CGST_AMOUNT: escapeHtml(formatInvoiceAmount(invoice.cgst_amount)),
    SGST_AMOUNT: escapeHtml(formatInvoiceAmount(invoice.sgst_amount)),
    TAX_AMOUNT: escapeHtml(formatInvoiceAmount(invoice.tax_amount)),
    GROSS_AMOUNT: escapeHtml(formatInvoiceAmount(invoice.gross_amount)),
    AMOUNT_IN_WORDS: escapeHtml(amountInWords(invoice.gross_amount)),
    PAYMENT_SECTION: buildPaymentSection(invoice),
    FOOTER_DISCLAIMER: escapeHtml(INVOICE_DEFAULTS.footerDisclaimer),
  });
}
