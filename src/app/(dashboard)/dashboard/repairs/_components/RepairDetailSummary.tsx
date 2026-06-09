'use client';

import Link from 'next/link';
import { Box, Grid, Paper, Typography, Chip, Stack } from '@mui/material';
import {
  Devices as DeviceIcon,
  Payments as PaymentsIcon,
  Place as PlaceIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { RepairRecord, RepairStatus, EstimateStatus } from '@/app/types/database';
import StatusBadge from '@/app/components/ui/StatusBadge';
import CurrentLocationBadge from '@/app/components/CurrentLocationBadge';
import { CurrentLocationType } from '@/app/types/database';
import { formatCurrency } from '@/lib/invoice-tax';
import { getDeviceFormatLabel, inferDeviceFormat } from '@/lib/device-format';

interface RepairDetailSummaryProps {
  repair: RepairRecord & {
    current_center?: { id: string; name: string };
  };
  status: RepairStatus;
  locationType?: CurrentLocationType;
  centerName?: string;
  pickupCenterName?: string;
  totalVisits: number;
  estimateStatus?: EstimateStatus;
}

function StatCard({
  icon,
  label,
  value,
  highlight,
  subValue,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
  subValue?: string;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        height: '100%',
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: highlight ? 'primary.main' : 'divider',
        bgcolor: highlight ? 'rgba(238, 100, 23, 0.04)' : '#FAFBFC',
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box
          sx={{
            color: highlight ? 'primary.main' : 'text.secondary',
            display: 'flex',
            mt: 0.25,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
            {label}
          </Typography>
          <Typography
            variant="body1"
            fontWeight={700}
            sx={{
              mt: 0.25,
              color: highlight ? 'primary.main' : 'text.primary',
              wordBreak: 'break-word',
            }}
          >
            {value}
          </Typography>
          {subValue && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
              {subValue}
            </Typography>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}

function formatDate(date: string | null | undefined) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function RepairDetailSummary({
  repair,
  status,
  locationType,
  centerName,
  pickupCenterName,
  totalVisits,
  estimateStatus,
}: RepairDetailSummaryProps) {
  const customerPays = repair.repair_estimate_by_company;
  const deviceFormat = getDeviceFormatLabel(inferDeviceFormat(repair));

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 3 },
        mb: 3,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        background: 'linear-gradient(135deg, rgba(238,100,23,0.06) 0%, rgba(255,255,255,1) 45%)',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1} sx={{ mb: 0.5 }}>
            <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em">
              {repair.patient_name}
            </Typography>
            <StatusBadge status={status} />
            {estimateStatus && estimateStatus !== 'Not Required' && (
              <StatusBadge status={estimateStatus} type="estimate" />
            )}
          </Stack>
          <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1}>
            <Typography
              variant="body2"
              fontWeight={700}
              sx={{ color: 'primary.main', fontFamily: 'monospace' }}
            >
              {repair.repair_id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ·
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {repair.phone}
            </Typography>
            {repair.visit_number != null && (
              <>
                <Typography variant="body2" color="text.secondary">
                  ·
                </Typography>
                <Chip
                  size="small"
                  label={
                    totalVisits > 0
                      ? `Visit ${repair.visit_number} of ${totalVisits}`
                      : `Visit ${repair.visit_number}`
                  }
                  sx={{ fontWeight: 600, height: 22 }}
                />
              </>
            )}
          </Stack>
          {repair.customer_id && totalVisits > 0 && (
            <Link
              href={`/dashboard/customers/${repair.customer_id}`}
              style={{
                color: '#EE6417',
                fontWeight: 600,
                fontSize: '0.8125rem',
                textDecoration: 'none',
                marginTop: 4,
                display: 'inline-block',
              }}
            >
              View all {totalVisits} customer visit{totalVisits !== 1 ? 's' : ''} →
            </Link>
          )}
        </Box>
        <CurrentLocationBadge locationType={locationType} centerName={centerName} />
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<DeviceIcon fontSize="small" />}
            label="Device"
            value={repair.model_item_name}
            subValue={`${deviceFormat}${repair.serial_no ? ` · ${repair.serial_no}` : ''}`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<PaymentsIcon fontSize="small" />}
            label="Customer Pays"
            value={customerPays ? formatCurrency(customerPays) : 'Not quoted'}
            highlight={Boolean(customerPays && customerPays > 0)}
            subValue={
              repair.customer_paid
                ? `Received ${formatCurrency(repair.customer_paid)}`
                : repair.estimate_by_us
                  ? `Markup ${formatCurrency(repair.estimate_by_us)}`
                  : undefined
            }
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<PlaceIcon fontSize="small" />}
            label="Receiving Center"
            value={repair.receiving_center || centerName || '—'}
            subValue={pickupCenterName ? `Pickup: ${pickupCenterName}` : undefined}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<CalendarIcon fontSize="small" />}
            label="Received On"
            value={formatDate(repair.date_of_receipt)}
            subValue={
              repair.date_out_to_customer
                ? `Completed ${formatDate(repair.date_out_to_customer)}`
                : repair.warranty
            }
          />
        </Grid>
      </Grid>
    </Paper>
  );
}
