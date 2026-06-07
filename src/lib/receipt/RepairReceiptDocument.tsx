import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import {
  formatEarLabel,
  formatSerialNumbers,
  getDeviceFormatLabel,
  inferDeviceFormat,
} from '@/lib/device-format';
import type { RepairRecord, Center } from '@/app/types/database';
import { COMPANY_CONFIG, RECEIPT_DEFAULTS } from './receipt-template.config';

export interface RepairReceiptDocumentProps {
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
  metaSection: { borderTopWidth: 1, borderTopColor: '#EDF2F7', paddingTop: 12, marginBottom: 14 },
  label: { fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', color: '#A0AEC0', marginBottom: 3 },
  patientName: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  intakeBox: { flexDirection: 'row', backgroundColor: '#FFF5F5', borderWidth: 1, borderColor: '#FED7D7', borderRadius: 4, marginBottom: 14 },
  intakeStat: { flex: 1, padding: 10, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#FED7D7' },
  intakeStatLast: { flex: 1, padding: 10, alignItems: 'center' },
  statLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', color: '#C53030', marginBottom: 3 },
  statVal: { fontSize: 11, fontFamily: 'Helvetica-Bold' },
  statValRed: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: RED },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1A202C', paddingVertical: 6, paddingHorizontal: 8, marginBottom: 2 },
  tableHeaderCell: { fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', color: '#4A5568' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#EDF2F7', paddingVertical: 8, paddingHorizontal: 8 },
  colModel: { width: '50%' },
  colEar: { width: '20%' },
  colSerial: { width: '30%' },
  modelName: { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  serialNo: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: RED },
  summaryBox: { borderWidth: 1, borderColor: '#EDF2F7', marginBottom: 14 },
  summaryHeader: { backgroundColor: '#F9FAFB', paddingVertical: 5, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#EDF2F7', fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', color: '#4A5568' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#EDF2F7' },
  summaryRowLast: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, paddingHorizontal: 12 },
  summaryLabel: { fontSize: 10, color: '#718096', width: '45%' },
  summaryValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', width: '52%', textAlign: 'right' },
  protocolTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', color: RED, marginBottom: 5, marginTop: 4 },
  protocolText: { fontSize: 9, color: '#4A5568', lineHeight: 1.5 },
  warningText: { fontSize: 9, color: RED, fontFamily: 'Helvetica-Bold', marginTop: 4 },
  footer: { marginTop: 16, borderTopWidth: 1, borderTopColor: '#EDF2F7', paddingTop: 10 },
  trackingBox: { backgroundColor: '#F7FAFC', borderWidth: 1, borderColor: '#CBD5E0', padding: 10, marginBottom: 8 },
  trackingId: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: RED, letterSpacing: 1 },
  disclaimer: { fontSize: 8, color: '#A0AEC0', fontStyle: 'italic', textAlign: 'center', marginTop: 6 },
  footerTag: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#E2E8F0', textTransform: 'uppercase', textAlign: 'center', marginTop: 8, letterSpacing: 1 },
});

function formatReceiptDate(date: string | null | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function SummaryRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={last ? styles.summaryRowLast : styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

export function RepairReceiptDocument({ repair, receivingCenter, logoDataUri }: RepairReceiptDocumentProps) {
  const centerName = receivingCenter?.name || repair.receiving_center || repair.current_center?.name || '-';
  const centerAddress = receivingCenter?.address || '-';
  const centerPhone = receivingCenter?.phone || COMPANY_CONFIG.phone;
  const deviceFormat = inferDeviceFormat(repair);
  const trackingInstructions = RECEIPT_DEFAULTS.trackingInstructions.replace('{{PATIENT_PHONE}}', repair.phone);

  const deviceRows =
    deviceFormat === 'kit' && repair.serial_no_2
      ? [
          { model: repair.model_item_name, ear: 'Left', serial: repair.serial_no, showFormat: true },
          { model: repair.model_item_name, ear: 'Right', serial: repair.serial_no_2, showFormat: false },
        ]
      : [{
          model: repair.model_item_name,
          ear: formatEarLabel(repair.ear, deviceFormat) || '-',
          serial: formatSerialNumbers(repair),
          showFormat: true,
        }];

  const summaryRows = [
    { label: 'Purpose / Complaint:', value: repair.purpose },
    repair.mould ? { label: 'Mould Type:', value: repair.mould } : null,
    repair.programming_done ? { label: 'Programming Done at Intake:', value: 'Yes' } : null,
    repair.warranty_after_repair ? { label: 'Warranty After Repair:', value: repair.warranty_after_repair } : null,
    repair.remarks ? { label: 'Additional Remarks:', value: repair.remarks } : null,
  ].filter((row): row is { label: string; value: string } => row !== null);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            {logoDataUri ? <Image src={logoDataUri} style={styles.logo} /> : null}
            <Text style={styles.companyName}>{COMPANY_CONFIG.legalName}</Text>
            <Text style={styles.textLight}>{COMPANY_CONFIG.address}</Text>
            <Text style={styles.textLight}>Contact: {COMPANY_CONFIG.phone} | Web: {COMPANY_CONFIG.website}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docType}>{RECEIPT_DEFAULTS.documentType}</Text>
            <Text style={styles.textMuted}>Issue Date:</Text>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 4 }}>{formatReceiptDate(repair.date_of_receipt)}</Text>
            <Text style={styles.textMuted}>Receipt No:</Text>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold' }}>{repair.repair_id}</Text>
          </View>
        </View>

        <View style={styles.metaSection}>
          <Text style={styles.label}>Patient Information</Text>
          <Text style={styles.patientName}>{repair.patient_name}</Text>
          <Text style={styles.textLight}>{[repair.email, `Phone: ${repair.phone}`].filter(Boolean).join(' | ')}</Text>
        </View>

        <View style={styles.intakeBox}>
          <View style={styles.intakeStat}><Text style={styles.statLabel}>Receiving Center</Text><Text style={styles.statVal}>{centerName}</Text></View>
          <View style={styles.intakeStat}><Text style={styles.statLabel}>Warranty Status</Text><Text style={styles.statVal}>{repair.warranty}</Text></View>
          <View style={styles.intakeStatLast}><Text style={styles.statLabel}>Manufacturer</Text><Text style={styles.statValRed}>{repair.company || 'Not specified'}</Text></View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.colModel]}>Model Name / Description</Text>
          <Text style={[styles.tableHeaderCell, styles.colEar]}>Ear</Text>
          <Text style={[styles.tableHeaderCell, styles.colSerial]}>Serial Number (S/N)</Text>
        </View>
        {deviceRows.map((row, index) => (
          <View key={index} style={styles.tableRow}>
            <View style={styles.colModel}>
              <Text style={styles.modelName}>{row.model}</Text>
              {row.showFormat && <Text style={styles.textLight}>{getDeviceFormatLabel(deviceFormat)}</Text>}
            </View>
            <Text style={[styles.colEar, { fontFamily: 'Helvetica-Bold', fontSize: 10 }]}>{row.ear}</Text>
            <Text style={[styles.colSerial, styles.serialNo]}>{row.serial}</Text>
          </View>
        ))}

        <View style={styles.summaryBox}>
          <Text style={styles.summaryHeader}>Intake Summary</Text>
          {summaryRows.map((row, index) => (
            <SummaryRow key={row.label} label={row.label} value={row.value} last={index === summaryRows.length - 1} />
          ))}
        </View>

        <Text style={styles.protocolTitle}>{RECEIPT_DEFAULTS.termsIntro}</Text>
        <View style={styles.protocolText}>
          <Text>• Your device has been received at our {centerName} center ({centerAddress}). Contact: {centerPhone}.</Text>
          <Text>• Please retain this receipt and your Repair ID for tracking the status of your device.</Text>
          <Text>• Repair timelines depend on manufacturer assessment and parts availability.</Text>
          <Text style={styles.warningText}>• The centre is not responsible for pre-existing damage, data loss, or accessories not handed over at intake.</Text>
          <Text>• Pickup: Please collect your device within 15 days of notification.</Text>
          <Text>• Warranty: Repairs are covered as per manufacturer policy and our service warranty terms.</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.trackingBox}>
            <Text style={styles.textLight}>{trackingInstructions}</Text>
            <Text style={{ fontSize: 9, marginTop: 4 }}>Your Repair Tracking ID: <Text style={styles.trackingId}>{repair.repair_id}</Text></Text>
          </View>
          <Text style={styles.disclaimer}>{RECEIPT_DEFAULTS.footerDisclaimer}</Text>
          <Text style={styles.footerTag}>{RECEIPT_DEFAULTS.footerTag}</Text>
        </View>
      </Page>
    </Document>
  );
}
