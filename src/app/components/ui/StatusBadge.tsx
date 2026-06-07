'use client';

import { Box } from '@mui/material';
import { RepairStatus, EstimateStatus } from '@/app/types/database';

const REPAIR_STATUS_COLORS: Record<RepairStatus, string> = {
  'Received': '#EE6417',
  'Sent to Company for Repair': '#F59E0B',
  'Returned from Manufacturer': '#3B82F6',
  'Ready for Pickup': '#3aa986',
  'Completed': '#10B981',
};

const ESTIMATE_STATUS_COLORS: Record<EstimateStatus, string> = {
  'Pending': '#F59E0B',
  'Approved': '#10B981',
  'Declined': '#EF4444',
  'Not Required': '#94A3B8',
};

interface StatusBadgeProps {
  status: RepairStatus | EstimateStatus | string;
  type?: 'repair' | 'estimate';
  size?: 'small' | 'medium';
}

export default function StatusBadge({ status, type = 'repair', size = 'medium' }: StatusBadgeProps) {
  const colorMap = type === 'estimate' ? ESTIMATE_STATUS_COLORS : REPAIR_STATUS_COLORS;
  const color = (colorMap as Record<string, string>)[status] || '#64748B';

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        backgroundColor: `${color}18`,
        color,
        py: size === 'small' ? 0.5 : 0.75,
        px: size === 'small' ? 1.25 : 1.75,
        borderRadius: '20px',
        fontWeight: 600,
        fontSize: size === 'small' ? '0.75rem' : '0.8125rem',
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
      }}
    >
      {status}
    </Box>
  );
}

export { REPAIR_STATUS_COLORS, ESTIMATE_STATUS_COLORS };
