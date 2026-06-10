'use client';

import { Box, Grid, Typography, Stack } from '@mui/material';
import {
  Person as PersonIcon,
  Devices as DeviceIcon,
  AccountBalance as FinancialIcon,
  Event as EventIcon,
  Notes as NotesIcon,
} from '@mui/icons-material';
import { RepairRecord, EstimateStatus } from '@/app/types/database';
import ContentCard from '@/app/components/ui/ContentCard';
import StatusBadge from '@/app/components/ui/StatusBadge';
import { formatEarLabel, getDeviceFormatLabel, inferDeviceFormat } from '@/lib/device-format';
import { formatCurrency } from '@/lib/invoice-tax';

interface RepairDetailSectionsProps {
  repair: RepairRecord;
  estimateStatus?: EstimateStatus;
}

function DetailRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value?: string | number | null;
  emphasize?: boolean;
}) {
  if (value == null || value === '') return null;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '140px 1fr' },
        gap: { xs: 0.25, sm: 2 },
        py: 1.25,
        alignItems: 'baseline',
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:last-of-type': { borderBottom: 'none' },
      }}
    >
      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        fontWeight={emphasize ? 700 : 500}
        sx={{ color: emphasize ? 'primary.main' : 'text.primary', wordBreak: 'break-word' }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
      <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
      <Typography variant="subtitle1" fontWeight={700}>
        {title}
      </Typography>
    </Stack>
  );
}

function formatDate(date: string | null | undefined) {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function RepairDetailSections({ repair, estimateStatus }: RepairDetailSectionsProps) {
  const hasEstimate = repair.repair_estimate_by_company && repair.repair_estimate_by_company > 0;
  const deviceFormat = inferDeviceFormat(repair);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <ContentCard>
          <SectionHeader icon={<PersonIcon fontSize="small" />} title="Customer" />
          <Box sx={{ mt: 1.5 }}>
            <DetailRow label="Name" value={repair.patient_name} emphasize />
            <DetailRow label="Phone" value={repair.phone} />
            <DetailRow label="Email" value={repair.email} />
            <DetailRow label="Company" value={repair.company} />
          </Box>
        </ContentCard>
      </Grid>

      <Grid item xs={12} md={6}>
        <ContentCard>
          <SectionHeader icon={<DeviceIcon fontSize="small" />} title="Device & Repair" />
          <Box sx={{ mt: 1.5 }}>
            <DetailRow label="Model" value={repair.model_item_name} emphasize />
            <DetailRow label="Intake" value={getDeviceFormatLabel(deviceFormat)} />
            {deviceFormat === 'kit' ? (
              <>
                <DetailRow label="Left Serial" value={repair.serial_no} />
                <DetailRow label="Right Serial" value={repair.serial_no_2} />
              </>
            ) : (
              <DetailRow label="Serial No." value={repair.serial_no} />
            )}
            {repair.ear && (
              <DetailRow label="Ear" value={formatEarLabel(repair.ear, deviceFormat)} />
            )}
            <DetailRow label="Warranty" value={repair.warranty} />
            <DetailRow label="Purpose" value={repair.purpose} />
            {repair.mould && <DetailRow label="Mould" value={repair.mould} />}
            {repair.warranty_after_repair && (
              <DetailRow label="Warranty After Repair" value={repair.warranty_after_repair} />
            )}
          </Box>
        </ContentCard>
      </Grid>

      <Grid item xs={12} md={6}>
        <ContentCard>
          <SectionHeader icon={<FinancialIcon fontSize="small" />} title="Financial" />
          <Box sx={{ mt: 1.5 }}>
            {hasEstimate && (
              <Box
                sx={{
                  mb: 2,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'rgba(238, 100, 23, 0.06)',
                  border: '1px solid rgba(238, 100, 23, 0.2)',
                }}
              >
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Customer Quote
                </Typography>
                <Typography variant="h5" fontWeight={800} color="primary.main">
                  {formatCurrency(repair.repair_estimate_by_company!)}
                </Typography>
                {estimateStatus && estimateStatus !== 'Not Required' && (
                  <Box sx={{ mt: 1 }}>
                    <StatusBadge status={estimateStatus} type="estimate" />
                  </Box>
                )}
              </Box>
            )}
            <DetailRow
              label="Company Invoice"
              value={
                repair.manufacturer_invoice_total
                  ? formatCurrency(repair.manufacturer_invoice_total)
                  : null
              }
            />
            <DetailRow label="Invoice No." value={repair.manufacturer_invoice_number} />
            {repair.manufacturer_invoice_base_amount != null && (
              <DetailRow
                label="Company Tax"
                value={`Net ${formatCurrency(repair.manufacturer_invoice_base_amount)} + CGST ${formatCurrency(repair.manufacturer_invoice_cgst_amount)} + SGST ${formatCurrency(repair.manufacturer_invoice_sgst_amount)}`}
              />
            )}
            <DetailRow
              label="Your Markup"
              value={repair.estimate_by_us ? formatCurrency(repair.estimate_by_us) : null}
            />
            <DetailRow
              label="Amount Received"
              value={repair.customer_paid ? formatCurrency(repair.customer_paid) : null}
              emphasize={Boolean(repair.customer_paid)}
            />
            <DetailRow label="Payment Mode" value={repair.payment_mode} />
            {repair.customer_tax_invoice && (
              <>
                <DetailRow
                  label="Tax Invoice No."
                  value={repair.customer_tax_invoice.invoice_number}
                  emphasize
                />
                <DetailRow
                  label="Tax Invoice Date"
                  value={formatDate(repair.customer_tax_invoice.invoice_date)}
                />
                <DetailRow
                  label="Tax Invoice Amount"
                  value={formatCurrency(repair.customer_tax_invoice.gross_amount)}
                />
              </>
            )}
          </Box>
        </ContentCard>
      </Grid>

      <Grid item xs={12} md={6}>
        <ContentCard>
          <SectionHeader icon={<EventIcon fontSize="small" />} title="Timeline" />
          <Box sx={{ mt: 1.5 }}>
            <DetailRow label="Received" value={formatDate(repair.date_of_receipt)} emphasize />
            <DetailRow label="Sent to Company" value={formatDate(repair.date_out_to_manufacturer)} />
            <DetailRow
              label="Returned from Manufacturer"
              value={formatDate(repair.date_received_from_manufacturer)}
            />
            <DetailRow label="Completed" value={formatDate(repair.date_out_to_customer)} />
            {repair.programming_done && (
              <DetailRow label="Programming" value="Complete" />
            )}
          </Box>
        </ContentCard>
      </Grid>

      {repair.remarks && (
        <Grid item xs={12}>
          <ContentCard>
            <SectionHeader icon={<NotesIcon fontSize="small" />} title="Remarks" />
            <Typography variant="body2" sx={{ mt: 1.5, lineHeight: 1.7 }}>
              {repair.remarks}
            </Typography>
          </ContentCard>
        </Grid>
      )}
    </Grid>
  );
}
