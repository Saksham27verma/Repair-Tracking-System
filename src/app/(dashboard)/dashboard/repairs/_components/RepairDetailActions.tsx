'use client';

import Link from 'next/link';
import { Box } from '@mui/material';
import { Edit as EditIcon, OpenInNew as PreviewIcon } from '@mui/icons-material';
import Button from '@mui/material/Button';
import RefreshButton from '@/app/components/RefreshButton';
import DownloadReceiptButton from '@/app/components/DownloadReceiptButton';

interface RepairDetailActionsProps {
  repairId: string;
  repairTrackingId: string;
  autoDownloadReceipt?: boolean;
}

export default function RepairDetailActions({
  repairId,
  repairTrackingId,
  autoDownloadReceipt = false,
}: RepairDetailActionsProps) {
  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      <DownloadReceiptButton
        repairId={repairId}
        repairTrackingId={repairTrackingId}
        variant="contained"
        size="small"
        autoDownload={autoDownloadReceipt}
      />
      <Button
        component="a"
        href={`/api/repairs/${repairId}/receipt?format=html`}
        target="_blank"
        rel="noopener noreferrer"
        variant="outlined"
        size="small"
        startIcon={<PreviewIcon />}
      >
        Preview Receipt
      </Button>
      <RefreshButton variant="outlined" size="small" />
      <Button
        component={Link}
        href={`/dashboard/repairs/${repairId}/edit`}
        variant="outlined"
        size="small"
        startIcon={<EditIcon />}
      >
        Edit Repair
      </Button>
    </Box>
  );
}
