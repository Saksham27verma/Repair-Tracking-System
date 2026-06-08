import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Box, Grid, Typography } from '@mui/material';
import { getFreshSupabaseClient } from '@/lib/supabase';
import { EstimateStatus } from '@/app/types/database';
import PageShell from '@/app/components/ui/PageShell';
import ContentCard from '@/app/components/ui/ContentCard';
import StatusBadge from '@/app/components/ui/StatusBadge';
import RepairDetailView from '../_components/RepairDetailView';
import RepairDetailActions from '../_components/RepairDetailActions';
import { formatEarLabel, getDeviceFormatLabel, inferDeviceFormat } from '@/lib/device-format';
import { formatCurrency } from '@/lib/invoice-tax';

export const dynamic = 'force-dynamic';

async function getRepair(id: string) {
  const freshClient = getFreshSupabaseClient();
  const { data: repair, error } = await freshClient
    .from('repairs')
    .select(`
      *,
      current_center:centers!repairs_current_center_id_fkey(id, name),
      pickup_center:centers!repairs_pickup_center_id_fkey(id, name)
    `)
    .eq('id', id)
    .single();

  if (error || !repair) return null;
  return repair;
}

async function getCustomerVisitCount(customerId: string | null | undefined) {
  if (!customerId) return 0;

  const freshClient = getFreshSupabaseClient();
  const { count, error } = await freshClient
    .from('repairs')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', customerId);

  if (error) return 0;
  return count ?? 0;
}

function formatDate(date: string | null | undefined) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={500}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500}>
        {value}
      </Typography>
    </Box>
  );
}

export default async function RepairDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { receipt?: string };
}) {
  const repair = await getRepair(params.id);
  if (!repair) notFound();

  const totalVisits = await getCustomerVisitCount(repair.customer_id);
  const estimateStatus = repair.estimate_status as EstimateStatus | undefined;
  const hasEstimate = repair.repair_estimate_by_company && repair.repair_estimate_by_company > 0;
  const autoDownloadReceipt = searchParams?.receipt === '1';

  return (
    <PageShell
      title="Repair Details"
      subtitle={`Repair ID: ${repair.repair_id}`}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Repairs', href: '/dashboard/repairs' },
        { label: repair.repair_id },
      ]}
      actions={
        <RepairDetailActions
          repairId={repair.id}
          repairTrackingId={repair.repair_id}
          autoDownloadReceipt={autoDownloadReceipt}
        />
      }
    >
      <RepairDetailView repair={repair} estimateStatus={estimateStatus} />

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <ContentCard title="Customer">
            <InfoRow label="Patient Name" value={repair.patient_name} />
            <InfoRow label="Phone" value={repair.phone} />
            <InfoRow label="Email" value={repair.email} />
            <InfoRow label="Company" value={repair.company} />
            {repair.visit_number != null && (
              <InfoRow
                label="Repair Visit"
                value={
                  totalVisits > 0
                    ? `Visit ${repair.visit_number} of ${totalVisits}`
                    : `Visit ${repair.visit_number}`
                }
              />
            )}
            {repair.customer_id && totalVisits > 0 && (
              <Box sx={{ mt: 1 }}>
                <Link
                  href={`/dashboard/customers/${repair.customer_id}`}
                  style={{ color: '#EE6417', fontWeight: 600, fontSize: '0.875rem' }}
                >
                  View all {totalVisits} visit{totalVisits !== 1 ? 's' : ''}
                </Link>
              </Box>
            )}
          </ContentCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ContentCard title="Device">
            <InfoRow label="Intake" value={getDeviceFormatLabel(inferDeviceFormat(repair))} />
            <InfoRow label="Model" value={repair.model_item_name} />
            {inferDeviceFormat(repair) === 'kit' ? (
              <>
                <InfoRow label="Left Serial" value={repair.serial_no} />
                <InfoRow label="Right Serial" value={repair.serial_no_2} />
              </>
            ) : (
              <InfoRow label="Serial No." value={repair.serial_no} />
            )}
            {repair.ear && (
              <InfoRow label="Ear" value={formatEarLabel(repair.ear, inferDeviceFormat(repair))} />
            )}
            <InfoRow label="Warranty" value={repair.warranty} />
            <InfoRow label="Purpose" value={repair.purpose} />
          </ContentCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ContentCard title="Financial">
            <InfoRow label="Company Invoice" value={repair.manufacturer_invoice_total ? formatCurrency(repair.manufacturer_invoice_total) : null} />
            {repair.manufacturer_invoice_number && (
              <InfoRow label="Invoice No." value={repair.manufacturer_invoice_number} />
            )}
            {repair.manufacturer_invoice_base_amount != null && (
              <InfoRow
                label="Tax Breakdown"
                value={`Net ${formatCurrency(repair.manufacturer_invoice_base_amount)} + CGST ${formatCurrency(repair.manufacturer_invoice_cgst_amount)} + SGST ${formatCurrency(repair.manufacturer_invoice_sgst_amount)}`}
              />
            )}
            <InfoRow label="You Added" value={repair.estimate_by_us ? formatCurrency(repair.estimate_by_us) : null} />
            <InfoRow label="Customer Pays" value={repair.repair_estimate_by_company ? formatCurrency(repair.repair_estimate_by_company) : null} />
            <InfoRow label="Amount Received" value={repair.customer_paid ? formatCurrency(repair.customer_paid) : null} />
            <InfoRow label="Payment Mode" value={repair.payment_mode} />
            {hasEstimate && estimateStatus && (
              <Box sx={{ mt: 1 }}>
                <StatusBadge status={estimateStatus} type="estimate" />
              </Box>
            )}
          </ContentCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ContentCard title="Key Dates">
            <InfoRow label="Received" value={formatDate(repair.date_of_receipt)} />
            <InfoRow label="Sent to Company" value={formatDate(repair.date_out_to_manufacturer)} />
            <InfoRow label="Returned from Manufacturer" value={formatDate(repair.date_received_from_manufacturer)} />
            <InfoRow label="Completed" value={formatDate(repair.date_out_to_customer)} />
          </ContentCard>
        </Grid>
        {repair.remarks && (
          <Grid item xs={12}>
            <ContentCard title="Remarks">
              <Typography variant="body2">{repair.remarks}</Typography>
            </ContentCard>
          </Grid>
        )}
      </Grid>
    </PageShell>
  );
}
