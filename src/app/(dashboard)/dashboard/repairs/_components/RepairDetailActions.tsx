'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Box } from '@mui/material';
import {
  Edit as EditIcon,
  OpenInNew as PreviewIcon,
  ReceiptLong as CreateInvoiceIcon,
} from '@mui/icons-material';
import Button from '@mui/material/Button';
import RefreshButton from '@/app/components/RefreshButton';
import DownloadReceiptButton from '@/app/components/DownloadReceiptButton';
import DownloadInvoiceButton from '@/app/components/DownloadInvoiceButton';
import CreateInvoiceDialog from '@/app/components/CreateInvoiceDialog';
import type { CustomerTaxInvoice, RepairRecord } from '@/app/types/database';

interface RepairDetailActionsProps {
  repair: RepairRecord;
  customerTaxInvoice?: CustomerTaxInvoice | null;
  autoDownloadReceipt?: boolean;
}

export default function RepairDetailActions({
  repair,
  customerTaxInvoice,
  autoDownloadReceipt = false,
}: RepairDetailActionsProps) {
  const router = useRouter();
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [autoDownloadInvoice, setAutoDownloadInvoice] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState(customerTaxInvoice?.invoice_number ?? '');

  const hasInvoice = Boolean(customerTaxInvoice || invoiceNumber);
  const displayInvoiceNumber = customerTaxInvoice?.invoice_number || invoiceNumber;

  const handleInvoiceCreated = (createdNumber: string) => {
    setInvoiceNumber(createdNumber);
    setAutoDownloadInvoice(true);
    router.refresh();
  };

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <DownloadReceiptButton
          repairId={repair.id}
          repairTrackingId={repair.repair_id}
          variant="contained"
          size="small"
          autoDownload={autoDownloadReceipt}
        />
        <Button
          component="a"
          href={`/api/repairs/${repair.id}/receipt?format=html`}
          target="_blank"
          rel="noopener noreferrer"
          variant="outlined"
          size="small"
          startIcon={<PreviewIcon />}
        >
          Preview Receipt
        </Button>

        {hasInvoice ? (
          <>
            <DownloadInvoiceButton
              repairId={repair.id}
              invoiceNumber={displayInvoiceNumber}
              variant="contained"
              size="small"
              autoDownload={autoDownloadInvoice}
            />
            <Button
              component="a"
              href={`/api/repairs/${repair.id}/invoice?format=html`}
              target="_blank"
              rel="noopener noreferrer"
              variant="outlined"
              size="small"
              startIcon={<PreviewIcon />}
            >
              Preview Invoice
            </Button>
          </>
        ) : (
          <Button
            variant="outlined"
            size="small"
            startIcon={<CreateInvoiceIcon />}
            onClick={() => setInvoiceDialogOpen(true)}
          >
            Create Invoice
          </Button>
        )}

        <RefreshButton variant="outlined" size="small" />
        <Button
          component={Link}
          href={`/dashboard/repairs/${repair.id}/edit`}
          variant="outlined"
          size="small"
          startIcon={<EditIcon />}
        >
          Edit Repair
        </Button>
      </Box>

      <CreateInvoiceDialog
        open={invoiceDialogOpen}
        onClose={() => setInvoiceDialogOpen(false)}
        repair={repair}
        onCreated={handleInvoiceCreated}
      />
    </>
  );
}
