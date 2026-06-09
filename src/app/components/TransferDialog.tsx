'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Typography,
  Box,
} from '@mui/material';
import {
  MovementType,
  LocationType,
  CurrentLocationType,
  RepairMovement,
} from '@/app/types/database';
import CenterSelect from './CenterSelect';
import {
  type RepairUpdatePayload,
  getAvailableMovementOptions,
  inferCenterFromMovements,
} from '@/lib/tracking';

interface TransferDialogProps {
  open: boolean;
  onClose: () => void;
  repairId: string;
  currentCenterId?: string;
  currentCenterName?: string;
  currentLocationType?: CurrentLocationType;
  movements?: RepairMovement[];
  onSuccess: (updated?: RepairUpdatePayload) => void;
}

const MOVEMENT_OPTIONS: {
  value: MovementType;
  label: string;
  description: string;
  toType: LocationType;
  needsCenter: boolean;
}[] = [
  {
    value: 'center_transfer',
    label: 'Transfer to Another Center',
    description: 'Device moved to a different Hope center. Add courier details below if shipped.',
    toType: 'center',
    needsCenter: true,
  },
  {
    value: 'sent_to_manufacturer',
    label: 'Send to Manufacturer',
    description: 'Device sent to Signia/Phonak/etc. for repair',
    toType: 'manufacturer',
    needsCenter: false,
  },
  {
    value: 'returned_from_manufacturer',
    label: 'Return from Manufacturer',
    description: 'Device received back from manufacturer at a center',
    toType: 'center',
    needsCenter: true,
  },
  {
    value: 'ready_for_pickup',
    label: 'Ready for Pickup at Center',
    description: 'Device is ready — select which center the patient will collect from',
    toType: 'center',
    needsCenter: true,
  },
  {
    value: 'delivered',
    label: 'Delivered to Customer',
    description: 'Device handed back to the customer',
    toType: 'customer',
    needsCenter: false,
  },
];

export default function TransferDialog({
  open,
  onClose,
  repairId,
  currentCenterId,
  currentCenterName,
  currentLocationType,
  movements = [],
  onSuccess,
}: TransferDialogProps) {
  const [movementType, setMovementType] = useState<MovementType>('center_transfer');
  const [toCenterId, setToCenterId] = useState('');
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [expectedArrival, setExpectedArrival] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const effectiveCenterId = useMemo(
    () => inferCenterFromMovements(movements, currentCenterId),
    [movements, currentCenterId]
  );

  const availableOptionTypes = useMemo(
    () => getAvailableMovementOptions(movements, currentLocationType, currentCenterId),
    [movements, currentLocationType, currentCenterId]
  );

  const availableOptions = useMemo(
    () => MOVEMENT_OPTIONS.filter((opt) => availableOptionTypes.includes(opt.value)),
    [availableOptionTypes]
  );

  useEffect(() => {
    if (!open) return;
    if (availableOptions.length === 0) return;
    if (!availableOptions.some((opt) => opt.value === movementType)) {
      setMovementType(availableOptions[0].value);
    }
  }, [open, availableOptions, movementType]);

  const selectedOption = MOVEMENT_OPTIONS.find((o) => o.value === movementType);
  const showShipmentFields =
    movementType === 'center_transfer' || movementType === 'sent_to_manufacturer';

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      if (!selectedOption) return;

      const now = new Date().toISOString();
      const isShipped =
        movementType === 'sent_to_manufacturer' ||
        (movementType === 'center_transfer' && (carrier || trackingNumber));
      const isReceived =
        movementType === 'returned_from_manufacturer' ||
        movementType === 'ready_for_pickup' ||
        movementType === 'delivered';

      const fromCenterId = effectiveCenterId;
      const fromLocationType: LocationType =
        movementType === 'returned_from_manufacturer'
          ? 'manufacturer'
          : fromCenterId
            ? 'center'
            : currentLocationType === 'in_transit'
              ? 'in_transit'
              : 'center';

      const body: Record<string, unknown> = {
        movement_type: selectedOption.value,
        from_location_type: fromLocationType,
        from_center_id: fromCenterId || undefined,
        to_location_type:
          movementType === 'center_transfer' && (carrier || trackingNumber)
            ? 'in_transit'
            : selectedOption.toType,
        to_center_id: selectedOption.needsCenter ? toCenterId : undefined,
        carrier: carrier || undefined,
        tracking_number: trackingNumber || undefined,
        expected_arrival: expectedArrival ? new Date(expectedArrival).toISOString() : undefined,
        notes: notes || undefined,
        shipped_at: isShipped ? now : undefined,
        received_at:
          isReceived
            ? now
            : movementType === 'center_transfer' && !carrier && !trackingNumber
              ? now
              : undefined,
      };

      if (selectedOption.needsCenter && !toCenterId) {
        setError('Please select a destination center');
        setLoading(false);
        return;
      }

      if (movementType === 'sent_to_manufacturer' && !fromCenterId && !currentLocationType) {
        setError('Could not determine which center is sending the device. Log a received movement first.');
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/repairs/${repairId}/movements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to log movement');
      }

      const updatedRepair = data.repair as RepairUpdatePayload | undefined;
      onSuccess(updatedRepair);
      onClose();
      setToCenterId('');
      setCarrier('');
      setTrackingNumber('');
      setExpectedArrival('');
      setNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Log Device Movement</DialogTitle>
      <DialogContent>
        {(currentCenterName || effectiveCenterId) && (
          <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <Typography variant="caption" color="text.secondary">Currently at</Typography>
            <Typography variant="body2" fontWeight={700}>
              {currentCenterName ||
                (currentLocationType === 'in_transit' ? 'In transit' : 'Service center')}
            </Typography>
          </Box>
        )}

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {availableOptions.length === 0 ? (
          <Alert severity="info">
            No further movements can be logged — this repair journey is complete.
          </Alert>
        ) : (
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="What happened?"
                value={movementType}
                onChange={(e) => setMovementType(e.target.value as MovementType)}
                size="small"
              >
                {availableOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
              {selectedOption && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {selectedOption.description}
                </Typography>
              )}
            </Grid>

            {selectedOption?.needsCenter && (
              <Grid item xs={12}>
                <CenterSelect
                  label={movementType === 'ready_for_pickup' ? 'Pickup Center' : 'Destination Center'}
                  name="to_center_id"
                  value={toCenterId}
                  onChange={setToCenterId}
                  required
                />
              </Grid>
            )}

            {showShipmentFields && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Carrier (optional)"
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    size="small"
                    placeholder="e.g. BlueDart, DTDC"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Tracking Number / AWB (optional)"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    label="Expected Arrival (optional)"
                    value={expectedArrival}
                    onChange={(e) => setExpectedArrival(e.target.value)}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={2}
                size="small"
                placeholder="Any additional details about this movement..."
              />
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || availableOptions.length === 0}
        >
          {loading ? <CircularProgress size={20} /> : 'Log Movement'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
