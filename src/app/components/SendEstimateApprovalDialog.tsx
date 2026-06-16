'use client';

import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Email as EmailIcon } from '@mui/icons-material';
import { EstimateStatus, RepairStatus } from '@/app/types/database';
import { formatCurrency } from '@/lib/invoice-tax';
import {
  validateEstimateApprovalRequest,
  type EstimateApprovalRequestField,
} from '@/lib/estimate-approval';

interface SendEstimateApprovalDialogProps {
  repairId: string;
  repairPublicId: string;
  status: RepairStatus;
  patientName: string;
  patientEmail?: string | null;
  manufacturerEstimate?: number | null;
  hopeMarkup?: number | null;
  customerQuote?: number | null;
  estimateStatus?: EstimateStatus | null;
  requestSentAt?: string | null;
  onSent?: () => void;
}

const FIELD_LABELS: Record<EstimateApprovalRequestField, string> = {
  manufacturer_estimate: 'Manufacturer estimate',
  customer_quote: 'Customer quote',
  patient_email: 'Patient email',
  repair_status: 'Repair status',
};

export default function SendEstimateApprovalDialog({
  repairId,
  status,
  patientName,
  patientEmail,
  manufacturerEstimate,
  hopeMarkup,
  customerQuote,
  estimateStatus,
  requestSentAt,
  onSent,
}: SendEstimateApprovalDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [mfgEstimate, setMfgEstimate] = useState(
    manufacturerEstimate != null ? String(manufacturerEstimate) : ''
  );
  const [markup, setMarkup] = useState(hopeMarkup != null ? String(hopeMarkup) : '');
  const [email, setEmail] = useState(patientEmail || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSend =
    status === 'Sent to Company for Repair' &&
    estimateStatus !== 'Approved' &&
    estimateStatus !== 'Declined';

  const draft = useMemo(
    () => ({
      manufacturer_estimate: mfgEstimate !== '' ? Number(mfgEstimate) : undefined,
      hope_markup: markup !== '' ? Number(markup) : undefined,
      email: email.trim() || undefined,
    }),
    [mfgEstimate, markup, email]
  );

  const validation = useMemo(
    () =>
      validateEstimateApprovalRequest(
        {
          status,
          manufacturer_invoice_estimate: manufacturerEstimate,
          estimate_by_us: hopeMarkup,
          repair_estimate_by_company: customerQuote,
          estimate_status: estimateStatus,
          email: patientEmail,
        },
        draft
      ),
    [
      status,
      manufacturerEstimate,
      hopeMarkup,
      customerQuote,
      estimateStatus,
      patientEmail,
      draft,
    ]
  );

  const needsForm = validation.missingFields.some((f) =>
    ['manufacturer_estimate', 'patient_email'].includes(f)
  );

  const previewQuote =
    validation.resolvedCustomerQuote > 0
      ? validation.resolvedCustomerQuote
      : (Number(mfgEstimate) || 0) + (Number(markup) || 0);

  const resetForm = () => {
    setMfgEstimate(manufacturerEstimate != null ? String(manufacturerEstimate) : '');
    setMarkup(hopeMarkup != null ? String(hopeMarkup) : '');
    setEmail(patientEmail || '');
    setError(null);
  };

  const handleOpen = () => {
    resetForm();
    setSuccess(null);
    if (validation.isValid) {
      setConfirmOpen(true);
    } else {
      setOpen(true);
    }
  };

  const sendRequest = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/repairs/${repairId}/send-estimate-approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manufacturer_estimate: mfgEstimate !== '' ? Number(mfgEstimate) : undefined,
          hope_markup: markup !== '' ? Number(markup) : undefined,
          email: email.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send approval request');

      setSuccess(data.message);
      setOpen(false);
      setConfirmOpen(false);
      onSent?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!canSend) return null;

  return (
    <>
      <Stack spacing={1} sx={{ mt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={<EmailIcon />}
          onClick={handleOpen}
          disabled={loading}
        >
          {requestSentAt ? 'Resend approval request to patient' : 'Send approval request to patient'}
        </Button>
        {requestSentAt && (
          <Typography variant="caption" color="text.secondary">
            Last sent {new Date(requestSentAt).toLocaleString('en-IN')}
          </Typography>
        )}
        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}
      </Stack>

      <Dialog open={open} onClose={() => !loading && setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Complete details &amp; send approval request</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Send a Hearing Hope email to <strong>{patientName}</strong> with a link to approve or
            decline the repair estimate before the device returns from the manufacturer.
          </Typography>

          {validation.missingFields.includes('repair_status') && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Approval requests can only be sent while the device is with the manufacturer and the
              estimate has not been decided yet.
            </Alert>
          )}

          <Stack spacing={2}>
            {(needsForm || validation.missingFields.includes('manufacturer_estimate')) && (
              <TextField
                fullWidth
                required
                size="small"
                type="number"
                label={FIELD_LABELS.manufacturer_estimate}
                value={mfgEstimate}
                onChange={(e) => setMfgEstimate(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  inputProps: { min: 0, step: 0.01 },
                }}
              />
            )}
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Your markup"
              value={markup}
              onChange={(e) => setMarkup(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                inputProps: { min: 0, step: 0.01 },
              }}
            />
            {(needsForm || validation.missingFields.includes('patient_email')) && (
              <TextField
                fullWidth
                required
                size="small"
                type="email"
                label={FIELD_LABELS.patient_email}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            )}
            {previewQuote > 0 && (
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#FFF7ED', border: '1px solid #FDBA74' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Patient will be asked to approve
                </Typography>
                <Typography variant="h6" fontWeight={800} color="primary.main">
                  {formatCurrency(previewQuote)}
                </Typography>
              </Box>
            )}
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={loading || validation.missingFields.includes('repair_status')}
            onClick={sendRequest}
          >
            {loading ? 'Sending…' : 'Save & send approval request'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmOpen} onClose={() => !loading && setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Send approval request?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Send a Hearing Hope email to <strong>{validation.resolvedEmail || patientEmail}</strong>{' '}
            for <strong>{formatCurrency(validation.resolvedCustomerQuote)}</strong>?
          </Typography>
          <Typography variant="caption" color="text.secondary">
            The patient can approve or decline via their repair tracking link.
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="contained" disabled={loading} onClick={sendRequest}>
            {loading ? 'Sending…' : 'Send email'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
