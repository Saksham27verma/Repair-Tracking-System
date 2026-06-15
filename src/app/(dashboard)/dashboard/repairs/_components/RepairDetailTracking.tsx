'use client';

import { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { LocalShipping as TransferIcon } from '@mui/icons-material';
import { RepairRecord } from '@/app/types/database';
import ContentCard from '@/app/components/ui/ContentCard';
import CurrentLocationBadge from '@/app/components/CurrentLocationBadge';
import DeviceJourneyTimeline from '@/app/components/DeviceJourneyTimeline';
import TransferDialog from '@/app/components/TransferDialog';
import type { EffectiveTrackingState, RepairUpdatePayload } from '@/lib/tracking';

interface RepairDetailTrackingProps {
  repairId: string;
  repair?: Partial<RepairRecord>;
  trackingState: EffectiveTrackingState;
  movementsLoading: boolean;
  onRepairUpdated?: (updated: RepairUpdatePayload) => void;
  onMovementsRefresh: () => Promise<void>;
}

export default function RepairDetailTracking({
  repairId,
  repair,
  trackingState,
  movementsLoading,
  onRepairUpdated,
  onMovementsRefresh,
}: RepairDetailTrackingProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleDeleteMovement = async (movementId: string) => {
    const res = await fetch(`/api/repairs/${repairId}/movements/${movementId}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete movement');
    }
    await onMovementsRefresh();
    if (data.repair) onRepairUpdated?.(data.repair);
  };

  const { displayMovements, hasRecordedMovements, locationType, centerName, pickupCenterName } =
    trackingState;

  return (
    <>
      <ContentCard
        title="Device Journey"
        action={
          <Button
            variant="contained"
            size="small"
            startIcon={<TransferIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Log Movement
          </Button>
        }
        sx={{ mb: 3 }}
      >
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 1 }}>
            WHERE IS THE DEVICE NOW?
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
            <CurrentLocationBadge
              locationType={locationType}
              centerName={centerName}
              size="medium"
            />
            {pickupCenterName && locationType === 'at_center' && (
              <Typography variant="body2" color="text.secondary">
                Pickup center: <strong>{pickupCenterName}</strong>
              </Typography>
            )}
          </Box>
        </Box>

        {movementsLoading ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
            Loading journey...
          </Typography>
        ) : (
          <>
            {!hasRecordedMovements && displayMovements.length > 0 && (
              <Typography variant="caption" color="warning.main" display="block" sx={{ mb: 2 }}>
                Reconstructed from repair dates. Log movements to record exact transfers.
              </Typography>
            )}
            <DeviceJourneyTimeline
              movements={displayMovements}
              onDeleteMovement={hasRecordedMovements ? handleDeleteMovement : undefined}
            />
          </>
        )}
      </ContentCard>

      <TransferDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        repairId={repairId}
        repair={repair}
        currentCenterId={trackingState.centerId || undefined}
        currentCenterName={centerName}
        currentLocationType={locationType}
        movements={hasRecordedMovements ? displayMovements : []}
        onSuccess={async (updated) => {
          await onMovementsRefresh();
          if (updated) onRepairUpdated?.(updated);
        }}
      />
    </>
  );
}
