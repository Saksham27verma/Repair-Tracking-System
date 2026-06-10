import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { formatCurrency } from '@/lib/invoice-tax';
import { buildLineItemDescription } from './invoice-description';
import type { CustomerTaxInvoice, RepairRecord, Center } from '@/app/types/database';
import { COMPANY_CONFIG } from '@/lib/receipt/receipt-template.config';
import { INVOICE_DEFAULTS, amountInWords } from './invoice-template.config';

export interface TaxInvoiceDocumentProps {
  invoice: CustomerTaxInvoice;
  repair: RepairRecord & {
    current_center?: Pick<Center, 'id' | 'name' | 'address' | 'phone'>;
    pickup_center?: Pick<Center, 'id' | 'name' | 'address' | 'phone'>;
  };
  receivingCenter?: Pick<Center, 'name' | 'address' | 'phone'> | null;
  logoDataUri?: string;
}

const RED = COMPANY_CONFIG.brandRed;

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 10, color: '#1A202C', fontFamily: 'Helvetica', lineHeight: 1.4 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  headerLeft: { width: '62%' },
  headerRight: { width: '35%', alignItems: 'flex-end' },
  logo: { width: 100, marginBottom: 6 },
  companyName: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: RED, textTransform: 'uppercase', marginBottom: 4 },
  textLight: { fontSize: 9, color: '#4A5568' },
  textMuted: { fontSize: 8, color: '#718096', textTransform: 'uppercase', letterSpacing: 1 },
  docType: {
    fontSize: 8, fontFamily: 'Helvetica-Bold', color: RED, textTransform: 'uppercase', letterSpacing: 1.5,
    borderWidth: 1, borderColor: RED, paddingVertical: 3, paddingHorizontal: 8, marginBottom: 6,
  },
  partyRow: { flexDirection: 'row', marginBottom: 14, gap: 8 },
  partyBox: { flex: 1, borderWidth: 1, borderColor: '#EDF2F7', padding: 10 },
  partyTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', color: '#A0AEC0', marginBottom: 6 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1A202C', paddingVertical: 6, paddingHorizontal: 6, marginBottom: 2 },
  tableHeaderCell: { fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', color: '#4A5568' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#EDF2F7', paddingVertical: 8, paddingHorizontal: 6 },
  colNum: { width: '5%' },
  colDesc: { width: '40%' },
  colHsn: { width: '10%' },
  colQty: { width: '8%' },
  colTaxable: { width: '17%' },
  colTotal: { width: '20%' },
  taxTable: { borderWidth: 1, borderColor: '#EDF2F7', marginBottom: 12 },
  taxHeader: { flexDirection: 'row', backgroundColor: '#F9FAFB', borderBottomWidth: 1, borderBottomColor: '#EDF2F7' },
  taxRow: { flexDirection: 'row', backgroundColor: '#FFF5F5' },
  taxCell: { flex: 1, padding: 8, fontSize: 9, borderRightWidth: 1, borderRightColor: '#EDF2F7' },
  taxCellLast: { flex: 1, padding: 8, fontSize: 9, fontFamily: 'Helvetica-Bold' },
  amountWords: { backgroundColor: '#F7FAFC', borderWidth: 1, borderColor: '#EDF2F7', padding: 10, marginBottom: 12, fontSize: 9 },
  paymentBox: { backgroundColor: '#F0FFF4', borderWidth: 1, borderColor: '#C6F6D5', padding: 10, marginBottom: 12, fontSize: 9 },
  footer: { marginTop: 16, borderTopWidth: 1, borderTopColor: '#EDF2F7', paddingTop: 10 },
  disclaimer: { fontSize: 8, color: '#A0AEC0', fontStyle: 'italic', textAlign: 'center' },
});

function formatInvoiceDate(date: string | null | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function TaxInvoiceDocument({
  invoice,
  repair,
  receivingCenter,
  logoDataUri,
}: TaxInvoiceDocumentProps) {
  const centerName =
    receivingCenter?.name || repair.receiving_center || repair.current_center?.name || '-';
  const description = buildLineItemDescription(repair);
  const cgstRate = invoice.gst_rate / 2;
  const sgstRate = invoice.gst_rate / 2;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            {logoDataUri ? <Image src={logoDataUri} style={styles.logo} /> : null}
            <Text style={styles.companyName}>{COMPANY_CONFIG.legalName}</Text>
            <Text style={styles.textLight}>{COMPANY_CONFIG.address}</Text>
            <Text style={styles.textLight}>
              GSTIN: {COMPANY_CONFIG.gstin} | State: {COMPANY_CONFIG.state} ({COMPANY_CONFIG.stateCode})
            </Text>
            <Text style={styles.textLight}>
              Contact: {COMPANY_CONFIG.phone} | Web: {COMPANY_CONFIG.website}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docType}>{INVOICE_DEFAULTS.documentType}</Text>
            <Text style={styles.textMuted}>Invoice No:</Text>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 4 }}>
              {invoice.invoice_number}
            </Text>
            <Text style={styles.textMuted}>Invoice Date:</Text>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 4 }}>
              {formatInvoiceDate(invoice.invoice_date)}
            </Text>
            <Text style={styles.textMuted}>Repair ID:</Text>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 4 }}>
              {repair.repair_id}
            </Text>
            <Text style={styles.textMuted}>Place of Supply:</Text>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold' }}>{invoice.place_of_supply}</Text>
          </View>
        </View>

        <View style={styles.partyRow}>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>Bill To</Text>
            <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold' }}>{repair.patient_name}</Text>
            <Text style={styles.textLight}>
              {[repair.email, `Phone: ${repair.phone}`].filter(Boolean).join(' | ')}
            </Text>
          </View>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>Service Centre</Text>
            <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold' }}>{centerName}</Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.colNum]}>#</Text>
          <Text style={[styles.tableHeaderCell, styles.colDesc]}>Description</Text>
          <Text style={[styles.tableHeaderCell, styles.colHsn]}>HSN/SAC</Text>
          <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
          <Text style={[styles.tableHeaderCell, styles.colTaxable]}>Taxable Value</Text>
          <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total (Incl. GST)</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={[styles.colNum, { fontSize: 10 }]}>1</Text>
          <Text style={[styles.colDesc, { fontSize: 10, fontFamily: 'Helvetica-Bold' }]}>{description}</Text>
          <Text style={[styles.colHsn, { fontSize: 10 }]}>{invoice.hsn_sac}</Text>
          <Text style={[styles.colQty, { fontSize: 10 }]}>1</Text>
          <Text style={[styles.colTaxable, { fontSize: 10 }]}>{formatCurrency(invoice.net_amount)}</Text>
          <Text style={[styles.colTotal, { fontSize: 10, fontFamily: 'Helvetica-Bold' }]}>
            {formatCurrency(invoice.gross_amount)}
          </Text>
        </View>

        <View style={styles.taxTable}>
          <View style={styles.taxHeader}>
            <Text style={styles.taxCell}>Taxable Value</Text>
            <Text style={styles.taxCell}>CGST @ {cgstRate}%</Text>
            <Text style={styles.taxCell}>SGST @ {sgstRate}%</Text>
            <Text style={styles.taxCell}>Total Tax</Text>
            <Text style={styles.taxCellLast}>Gross Total</Text>
          </View>
          <View style={styles.taxRow}>
            <Text style={styles.taxCell}>{formatCurrency(invoice.net_amount)}</Text>
            <Text style={styles.taxCell}>{formatCurrency(invoice.cgst_amount)}</Text>
            <Text style={styles.taxCell}>{formatCurrency(invoice.sgst_amount)}</Text>
            <Text style={styles.taxCell}>{formatCurrency(invoice.tax_amount)}</Text>
            <Text style={styles.taxCellLast}>{formatCurrency(invoice.gross_amount)}</Text>
          </View>
        </View>

        <View style={styles.amountWords}>
          <Text>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>Amount in Words: </Text>
            {amountInWords(invoice.gross_amount)}
          </Text>
        </View>

        {invoice.payment_mode ? (
          <View style={styles.paymentBox}>
            <Text>
              Payment Received: {formatCurrency(invoice.gross_amount)} via {invoice.payment_mode}
            </Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.disclaimer}>{INVOICE_DEFAULTS.footerDisclaimer}</Text>
        </View>
      </Page>
    </Document>
  );
}
