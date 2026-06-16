'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { EstimateApprovedBy, EstimateStatus } from '@/app/types/database';
import { formatCurrency } from '@/lib/invoice-tax';
import { getEstimateApprovalLabel } from '@/lib/estimate-approval';
import SendEstimateApprovalDialog from '@/app/components/SendEstimateApprovalDialog';

interface StaffEstimateApprovalProps {
  repairId: string;
  repairPublicId: string;
  patientName: string;
  estimate: number;
  estimateStatus: EstimateStatus;
  estimateApprovedBy?: EstimateApprovedBy | null;
  estimateApprovalDate?: string | null;
  patientEmail?: string | null;
  manufacturerEstimate?: number | null;
  hopeMarkup?: number | null;
  requestSentAt?: string | null;
  /** Quote must be approved before device return from manufacturer */
  beforeReturn?: boolean;
  onApproved?: () => void;
}

export default function StaffEstimateApproval({
  repairId,
  repairPublicId,
  patientName,
  estimate,
  estimateStatus,
  estimateApprovedBy,
  estimateApprovalDate,
  patientEmail,
  manufacturerEstimate,
  hopeMarkup,
  requestSentAt,
  beforeReturn = false,
  onApproved,
}: StaffEstimateApprovalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogAction, setDialogAction] = useState<'approve' | 'decline' | null>(null);

  const isPending = estimateStatus === 'Pending';
  const isResolved = estimateStatus === 'Approved' || estimateStatus === 'Declined';

  if (!estimate || estimate <= 0) return null;

  const submitDecision = async (status: 'Approved' | 'Declined') => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/estimate-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repairId: repairPublicId,
          status,
          approvedBy: 'staff' as EstimateApprovedBy,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update estimate status');
      }

      setDialogAction(null);
      onApproved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 2.5,
          border: '2px solid',
          borderColor: isPending ? '#F59E0B' : isResolved && estimateStatus === 'Approved' ? '#10B981' : '#EF4444',
          bgcolor: isPending ? '#FFFBEB' : isResolved && estimateStatus === 'Approved' ? '#F0FDF4' : '#FEF2F2',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <PhoneIcon sx={{ color: isPending ? '#D97706' : 'text.secondary', mt: 0.25 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              {isPending ? 'Estimate approval required' : 'Estimate decision recorded'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Customer quote: <strong>{formatCurrency(estimate)}</strong>
              {isPending
                ? beforeReturn
                  ? ' — patient must approve or decline before the device can be returned from the manufacturer.'
                  : ' — waiting for patient approval before the repair can proceed to pickup.'
                : ` — ${estimateStatus.toLowerCase()}${estimateApprovedBy ? ` (${getEstimateApprovalLabel(estimateApprovedBy).toLowerCase()})` : ''}.`}
            </Typography>
            {isResolved && estimateStatus === 'Declined' && beforeReturn && (
              <Alert severity="info" sx={{ mt: 1.5 }}>
                Repair discontinued. Use <strong>Log Movement → Return from Manufacturer</strong> to
                schedule the device coming back without repair.
              </Alert>
            )}
            {estimateApprovalDate && isResolved && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Recorded {new Date(estimateApprovalDate).toLocaleString('en-IN')}
              </Typography>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 1.5 }}>
                {error}
              </Alert>
            )}

            {isPending && (
              <>
                {!patientEmail && (
                  <Alert severity="warning" sx={{ mt: 1.5 }}>
                    No patient email on file. Use the button below to add an email and send the
                    approval request.
                  </Alert>
                )}
                <SendEstimateApprovalDialog
                  repairId={repairId}
                  repairPublicId={repairPublicId}
                  status="Sent to Company for Repair"
                  patientName={patientName}
                  patientEmail={patientEmail}
                  manufacturerEstimate={manufacturerEstimate}
                  hopeMarkup={hopeMarkup}
                  customerQuote={estimate}
                  estimateStatus={estimateStatus}
                  requestSentAt={requestSentAt}
                  onSent={onApproved}
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<CheckIcon />}
                  disabled={loading}
                  onClick={() => setDialogAction('approve')}
                >
                  Approve on behalf of patient (phone)
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<CloseIcon />}
                  disabled={loading}
                  onClick={() => setDialogAction('decline')}
                >
                  Decline on behalf of patient (phone)
                </Button>
              </Stack>
              </>
            )}

            {isResolved && estimateApprovedBy === 'staff' && (
              <Alert severity="info" sx={{ mt: 1.5 }}>
                This will appear on the patient&apos;s repair page as approved by Hearing Hope after phone confirmation.
              </Alert>
            )}
          </Box>
        </Stack>
      </Paper>

      <Dialog open={dialogAction !== null} onClose={() => !loading && setDialogAction(null)}>
        <DialogTitle>
          {dialogAction === 'approve' ? 'Approve estimate on behalf of patient' : 'Decline estimate on behalf of patient'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            {dialogAction === 'approve'
              ? `Confirm that ${formatCurrency(estimate)} was approved by the patient over a phone call. This will be recorded as approved by Hearing Hope on their repair tracking page.`
              : `Confirm that the patient declined ${formatCurrency(estimate)} over a phone call. The repair will not proceed.`}
          </Typography>
          <Alert severity="warning">
            Only use this after speaking with the patient directly. Their tracking page will show this was confirmed by our team.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogAction(null)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={dialogAction === 'approve' ? 'primary' : 'error'}
            disabled={loading}
            onClick={() => submitDecision(dialogAction === 'approve' ? 'Approved' : 'Declined')}
          >
            {dialogAction === 'approve' ? 'Confirm approval' : 'Confirm decline'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
