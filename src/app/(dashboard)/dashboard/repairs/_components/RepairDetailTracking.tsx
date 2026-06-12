'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Button, Typography, Chip } from '@mui/material';
import { LocalShipping as TransferIcon, Store as StoreIcon } from '@mui/icons-material';
import { RepairMovement, CurrentLocationType, RepairRecord } from '@/app/types/database';
import ContentCard from '@/app/components/ui/ContentCard';
import CurrentLocationBadge from '@/app/components/CurrentLocationBadge';
import DeviceJourneyTimeline from '@/app/components/DeviceJourneyTimeline';
import TransferDialog from '@/app/components/TransferDialog';
import { buildLegacyMovements } from '@/lib/tracking';
import type { RepairUpdatePayload } from '@/lib/tracking';

interface RepairDetailTrackingProps {
  repairId: string;
  repair?: Partial<RepairRecord>;
  currentCenterId?: string;
  currentLocationType?: CurrentLocationType;
  currentCenterName?: string;
  pickupCenterName?: string;
  receivingCenter?: string;
  onRepairUpdated?: (updated: RepairUpdatePayload) => void;
}

export default function RepairDetailTracking({
  repairId,
  repair,
  currentCenterId,
  currentLocationType,
  currentCenterName,
  pickupCenterName,
  receivingCenter,
  onRepairUpdated,
}: RepairDetailTrackingProps) {
  const [movements, setMovements] = useState<RepairMovement[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchMovements = useCallback(async () => {
    try {
      const res = await fetch(`/api/repairs/${repairId}/movements`);
      if (res.ok) {
        const data = await res.json();
        setMovements(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch movements:', err);
    } finally {
      setLoading(false);
    }
  }, [repairId]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const displayMovements =
    movements.length > 0
      ? movements
      : repair
      ? buildLegacyMovements(repair)
      : [];

  const handleDeleteMovement = async (movementId: string) => {
    const res = await fetch(`/api/repairs/${repairId}/movements/${movementId}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete movement');
    }
    await fetchMovements();
    if (data.repair) onRepairUpdated?.(data.repair);
  };

  return (
    <>
      <ContentCard
        title="Complete Device Journey"
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
        <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
          <CurrentLocationBadge
            locationType={currentLocationType}
            centerName={currentCenterName}
          />
          {receivingCenter && (
            <Chip
              icon={<StoreIcon />}
              label={`Received at: ${receivingCenter}`}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          )}
          {pickupCenterName && (
            <Chip
              icon={<StoreIcon />}
              label={`Pickup at: ${pickupCenterName}`}
              size="small"
              color="secondary"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Box>

        {!loading && (
          <>
            {movements.length === 0 && displayMovements.length > 0 && (
              <Typography variant="caption" color="warning.main" display="block" sx={{ mb: 2 }}>
                Showing reconstructed journey from repair dates. Log movements to record full transfer details.
              </Typography>
            )}
            <DeviceJourneyTimeline
              movements={displayMovements}
              onDeleteMovement={movements.length > 0 ? handleDeleteMovement : undefined}
            />
          </>
        )}
        {loading && (
          <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
            Loading journey...
          </Typography>
        )}
      </ContentCard>

      <TransferDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        repairId={repairId}
        repair={repair}
        currentCenterId={currentCenterId}
        currentCenterName={currentCenterName}
        currentLocationType={currentLocationType}
        movements={displayMovements}
        onSuccess={(updated) => {
          fetchMovements();
          if (updated) onRepairUpdated?.(updated);
        }}
      />
    </>
  );
}
