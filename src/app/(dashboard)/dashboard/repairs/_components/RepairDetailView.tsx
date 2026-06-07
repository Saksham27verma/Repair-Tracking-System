'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Grid } from '@mui/material';
import {
  CurrentLocationType,
  EstimateStatus,
  RepairRecord,
  RepairStatus,
} from '@/app/types/database';
import ContentCard from '@/app/components/ui/ContentCard';
import StatusBadge from '@/app/components/ui/StatusBadge';
import RepairStatusStepper from '@/app/components/RepairStatusStepper';
import RepairDetailTracking from './RepairDetailTracking';
import { RepairUpdatePayload } from '@/lib/tracking';

interface RepairDetailViewProps {
  repair: RepairRecord & {
    current_center?: { id: string; name: string };
    pickup_center?: { id: string; name: string };
  };
  estimateStatus?: EstimateStatus;
}

export default function RepairDetailView({ repair, estimateStatus }: RepairDetailViewProps) {
  const router = useRouter();
  const [status, setStatus] = useState<RepairStatus>(repair.status);
  const [locationType, setLocationType] = useState<CurrentLocationType | undefined>(
    repair.current_location_type
  );
  const [centerName, setCenterName] = useState(repair.current_center?.name);
  const [pickupCenterName, setPickupCenterName] = useState(repair.pickup_center?.name);

  const handleRepairUpdated = (updated: RepairUpdatePayload) => {
    if (updated.status) setStatus(updated.status);
    if (updated.current_location_type) setLocationType(updated.current_location_type);
    if (updated.current_center !== undefined) {
      setCenterName(updated.current_center?.name);
    }
    if (updated.pickup_center !== undefined) {
      setPickupCenterName(updated.pickup_center?.name);
    }
    router.refresh();
  };

  return (
    <>
      <RepairDetailTracking
        repairId={repair.id}
        repair={repair}
        currentCenterId={repair.current_center_id}
        currentLocationType={locationType}
        currentCenterName={centerName}
        pickupCenterName={pickupCenterName}
        receivingCenter={repair.receiving_center}
        onRepairUpdated={handleRepairUpdated}
      />

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12}>
          <ContentCard title="Repair Status">
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <StatusBadge status={status} />
            </Box>
            <RepairStatusStepper
              currentStatus={status}
              size="medium"
              withTooltips
              estimateStatus={estimateStatus}
            />
          </ContentCard>
        </Grid>
      </Grid>
    </>
  );
}
