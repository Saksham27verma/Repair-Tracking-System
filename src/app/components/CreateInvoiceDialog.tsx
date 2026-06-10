'use client';

import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import toast from 'react-hot-toast';
import type { RepairRecord } from '@/app/types/database';
import { calculateTaxFromInclusive, formatCurrency } from '@/lib/invoice-tax';
import {
  resolveInvoiceGstRate,
  resolveInvoiceGrossAmount,
  validateRepairForInvoice,
} from '@/lib/invoice/invoice-utils';
import { buildLineItemDescription } from '@/lib/invoice/invoice-description';
import { formatEarLabel, formatSerialNumbers, inferDeviceFormat } from '@/lib/device-format';

interface CreateInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  repair: RepairRecord;
  onCreated: (invoiceNumber: string) => void;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '140px 1fr',
        gap: 2,
        py: 0.75,
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:last-of-type': { borderBottom: 'none' },
      }}
    >
      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500}>
        {value}
      </Typography>
    </Box>
  );
}

export default function CreateInvoiceDialog({
  open,
  onClose,
  repair,
  onCreated,
}: CreateInvoiceDialogProps) {
  const [invoiceDate, setInvoiceDate] = useState<Dayjs | null>(dayjs());
  const [submitting, setSubmitting] = useState(false);

  const validation = useMemo(() => validateRepairForInvoice(repair), [repair]);
  const grossAmount = resolveInvoiceGrossAmount(repair);
  const gstRate = resolveInvoiceGstRate(repair);
  const taxBreakdown = useMemo(
    () => calculateTaxFromInclusive(grossAmount, gstRate),
    [grossAmount, gstRate]
  );

  const deviceFormat = inferDeviceFormat(repair);
  const serialDisplay =
    deviceFormat === 'kit' && repair.serial_no_2
      ? `Left: ${repair.serial_no}, Right: ${repair.serial_no_2}`
      : formatSerialNumbers(repair);

  const amountSourceLabel =
    validation.amountSource === 'customer_paid'
      ? 'Amount customer paid'
      : validation.amountSource === 'repair_estimate_by_company'
        ? 'Customer quote (company invoice + markup)'
        : '—';

  const handleCreate = async () => {
    if (!validation.valid) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/repairs/${repair.id}/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_date: invoiceDate?.isValid() ? invoiceDate.format('YYYY-MM-DD') : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create invoice');
      }

      toast.success(`Tax invoice ${data.invoice_number} created`);
      onCreated(data.invoice_number);
      onClose();
    } catch (error) {
      console.error('Create invoice failed:', error);
      toast.error(error instanceof Error ? error.message : 'Could not create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Tax Invoice</DialogTitle>
      <DialogContent>
        {!validation.valid && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {validation.errors.join(' ')}
          </Alert>
        )}

        <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ mb: 1 }}>
          Customer
        </Typography>
        <SummaryRow label="Name" value={repair.patient_name} />
        <SummaryRow label="Phone" value={repair.phone} />
        {repair.email && <SummaryRow label="Email" value={repair.email} />}

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ mb: 1 }}>
          Device
        </Typography>
        <SummaryRow label="Model" value={repair.model_item_name} />
        <SummaryRow label="Serial" value={serialDisplay} />
        {repair.ear && (
          <SummaryRow label="Ear" value={formatEarLabel(repair.ear, deviceFormat) || '—'} />
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ mb: 1 }}>
          Invoice Amount
        </Typography>
        <SummaryRow label="Source" value={amountSourceLabel} />
        <SummaryRow label="Gross Amount" value={formatCurrency(grossAmount)} />
        <SummaryRow label="GST Rate" value={`${gstRate}%`} />
        <SummaryRow
          label="Tax Breakdown"
          value={`Net ${formatCurrency(taxBreakdown.netValue)} + CGST ${formatCurrency(taxBreakdown.cgstAmount)} + SGST ${formatCurrency(taxBreakdown.sgstAmount)}`}
        />
        {repair.payment_mode && (
          <SummaryRow label="Payment Mode" value={repair.payment_mode} />
        )}

        <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
          <Typography variant="caption" color="text.secondary">
            Line item
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {buildLineItemDescription(repair)}
          </Typography>
        </Box>

        <Box sx={{ mt: 2 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Invoice Date"
              value={invoiceDate}
              onChange={(date) => setInvoiceDate(date)}
              slotProps={{ textField: { fullWidth: true, size: 'small' } }}
            />
          </LocalizationProvider>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleCreate}
          disabled={!validation.valid || submitting}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {submitting ? 'Creating…' : 'Create Invoice'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
