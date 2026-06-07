'use client';

import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { Store as StoreIcon } from '@mui/icons-material';
import { RepairMovement, CurrentLocationType, RepairRecord } from '@/app/types/database';
import ContentCard from '@/app/components/ui/ContentCard';
import CurrentLocationBadge from '@/app/components/CurrentLocationBadge';
import DeviceJourneyTimeline from '@/app/components/DeviceJourneyTimeline';
import { buildLegacyMovements } from '@/lib/tracking';

interface PublicRepairTrackingProps {
  repairUuid: string;
  repair?: Partial<RepairRecord>;
  currentLocationType?: CurrentLocationType;
  currentCenterName?: string;
  pickupCenterName?: string;
  receivingCenter?: string;
}

export default function PublicRepairTracking({
  repairUuid,
  repair,
  currentLocationType,
  currentCenterName,
  pickupCenterName,
  receivingCenter,
}: PublicRepairTrackingProps) {
  const [movements, setMovements] = useState<RepairMovement[]>([]);

  useEffect(() => {
    fetch(`/api/repairs/${repairUuid}/movements`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMovements(data);
      })
      .catch(console.error);
  }, [repairUuid]);

  const displayMovements =
    movements.length > 0 ? movements : repair ? buildLegacyMovements(repair) : [];

  return (
    <ContentCard title="Your Device Journey">
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
        <CurrentLocationBadge
          locationType={currentLocationType}
          centerName={currentCenterName}
          size="medium"
        />
        {receivingCenter && (
          <Typography variant="body2" color="text.secondary">
            Received at: <strong>{receivingCenter}</strong>
          </Typography>
        )}
      </Box>

      {pickupCenterName && (
        <Box
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 2,
            bgcolor: 'rgba(58, 169, 134, 0.08)',
            border: '1px solid rgba(58, 169, 134, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <StoreIcon sx={{ color: 'secondary.main' }} />
          <Box>
            <Typography variant="body2" color="text.secondary">
              Pickup Center
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {pickupCenterName}
            </Typography>
          </Box>
        </Box>
      )}

      <DeviceJourneyTimeline movements={displayMovements} />
    </ContentCard>
  );
}
