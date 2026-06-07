import {
  formatEarLabel,
  formatSerialNumbers,
  getDeviceFormatLabel,
  inferDeviceFormat,
} from '@/lib/device-format';
import type { RepairRecord, Center } from '@/app/types/database';
import { COMPANY_CONFIG, RECEIPT_DEFAULTS } from './receipt-template.config';
import { getReceiptLogoDataUri } from './logo';
import { getReceiptTemplateHtml } from './get-receipt-template';

export interface BuildReceiptHtmlInput {
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

function formatReceiptDate(date: string | null | undefined): string {
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

function buildDeviceRows(repair: BuildReceiptHtmlInput['repair']): string {
  const format = inferDeviceFormat(repair);

  if (format === 'kit' && repair.serial_no_2) {
    return `
      <tr>
        <td>
          <div style="font-weight: 700;">${escapeHtml(repair.model_item_name)}</div>
          <div class="text-light">${escapeHtml(getDeviceFormatLabel(format))}</div>
        </td>
        <td style="font-weight: 600;">Left</td>
        <td style="font-weight: 700; color: ${COMPANY_CONFIG.brandRed};">${escapeHtml(repair.serial_no)}</td>
      </tr>
      <tr>
        <td><div style="font-weight: 700;">${escapeHtml(repair.model_item_name)}</div></td>
        <td style="font-weight: 600;">Right</td>
        <td style="font-weight: 700; color: ${COMPANY_CONFIG.brandRed};">${escapeHtml(repair.serial_no_2)}</td>
      </tr>
    `;
  }

  return `
    <tr>
      <td>
        <div style="font-weight: 700;">${escapeHtml(repair.model_item_name)}</div>
        <div class="text-light">${escapeHtml(getDeviceFormatLabel(format))}</div>
      </td>
      <td style="font-weight: 600;">${escapeHtml(formatEarLabel(repair.ear, format) || '-')}</td>
      <td style="font-weight: 700; color: ${COMPANY_CONFIG.brandRed};">${escapeHtml(formatSerialNumbers(repair))}</td>
    </tr>
  `;
}

function buildSummaryRows(repair: BuildReceiptHtmlInput['repair']): string {
  const rows = [
    { label: 'Purpose / Complaint:', value: repair.purpose },
    repair.mould ? { label: 'Mould Type:', value: repair.mould } : null,
    repair.programming_done ? { label: 'Programming Done at Intake:', value: 'Yes' } : null,
    repair.warranty_after_repair
      ? { label: 'Warranty After Repair:', value: repair.warranty_after_repair }
      : null,
    repair.remarks ? { label: 'Additional Remarks:', value: repair.remarks } : null,
  ].filter((row): row is { label: string; value: string } => row !== null);

  return rows
    .map(
      (row) => `
      <tr class="security-row">
        <td class="security-label">${escapeHtml(row.label)}</td>
        <td class="security-value">${escapeHtml(row.value)}</td>
      </tr>
    `
    )
    .join('');
}

function buildTermsItems(
  repair: BuildReceiptHtmlInput['repair'],
  centerName: string,
  centerAddress: string,
  centerPhone: string
): string {
  const items = [
    `Your device has been received at our <strong>${escapeHtml(centerName)}</strong> center (${escapeHtml(centerAddress)}). Contact: <strong>${escapeHtml(centerPhone)}</strong>.`,
    'Please retain this receipt and your Repair ID for tracking the status of your device.',
    'Repair timelines depend on manufacturer assessment and parts availability. We will notify you of any estimate before proceeding with out-of-warranty repairs.',
    '<span class="warning-text">The centre is not responsible for pre-existing damage, data loss, or accessories not handed over at the time of intake.</span>',
    '<strong>Pickup:</strong> Please collect your device within 15 days of notification. Devices not collected within 90 days may attract storage charges.',
    '<strong>Warranty:</strong> Repairs are covered as per manufacturer policy and our service warranty terms communicated at delivery.',
  ];

  return items.map((item) => `<li>${item}</li>`).join('');
}

export async function buildRepairReceiptHtml(input: BuildReceiptHtmlInput): Promise<string> {
  const { repair, receivingCenter } = input;
  const template = await getReceiptTemplateHtml();
  const logoSrc = await getReceiptLogoDataUri();

  const centerName =
    receivingCenter?.name || repair.receiving_center || repair.current_center?.name || '-';
  const centerAddress = receivingCenter?.address || '-';
  const centerPhone = receivingCenter?.phone || COMPANY_CONFIG.phone;

  const patientContact = [
    repair.email ? escapeHtml(repair.email) : null,
    `<strong>Phone:</strong> ${escapeHtml(repair.phone)}`,
  ]
    .filter(Boolean)
    .join(' | ');

  const trackingInstructions = RECEIPT_DEFAULTS.trackingInstructions.replace(
    '{{PATIENT_PHONE}}',
    escapeHtml(repair.phone)
  );

  return replaceAll(template, {
    LOGO_SRC: logoSrc,
    COMPANY_NAME: escapeHtml(COMPANY_CONFIG.legalName),
    COMPANY_ADDRESS: escapeHtml(COMPANY_CONFIG.address),
    COMPANY_PHONE: escapeHtml(COMPANY_CONFIG.phone),
    COMPANY_WEBSITE: escapeHtml(COMPANY_CONFIG.website),
    DOCUMENT_TYPE: escapeHtml(RECEIPT_DEFAULTS.documentType),
    RECEIPT_DATE: escapeHtml(formatReceiptDate(repair.date_of_receipt)),
    RECEIPT_NUMBER: escapeHtml(repair.repair_id),
    PATIENT_NAME: escapeHtml(repair.patient_name),
    PATIENT_CONTACT: patientContact,
    RECEIVING_CENTER: escapeHtml(centerName),
    WARRANTY_STATUS: escapeHtml(repair.warranty),
    MANUFACTURER: escapeHtml(repair.company || 'Not specified'),
    DEVICE_ROWS: buildDeviceRows(repair),
    INTAKE_SUMMARY_ROWS: buildSummaryRows(repair),
    TERMS_TITLE: escapeHtml(RECEIPT_DEFAULTS.termsIntro),
    TERMS_ITEMS: buildTermsItems(repair, centerName, centerAddress, centerPhone),
    TRACKING_INSTRUCTIONS: trackingInstructions,
    REPAIR_ID: escapeHtml(repair.repair_id),
    FOOTER_DISCLAIMER: escapeHtml(RECEIPT_DEFAULTS.footerDisclaimer),
    FOOTER_TAG: escapeHtml(RECEIPT_DEFAULTS.footerTag),
  });
}
