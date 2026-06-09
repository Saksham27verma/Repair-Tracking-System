'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box } from '@mui/material';
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
import RepairDetailSummary from './RepairDetailSummary';
import RepairDetailSections from './RepairDetailSections';
import { RepairUpdatePayload } from '@/lib/tracking';

interface RepairDetailViewProps {
  repair: RepairRecord & {
    current_center?: { id: string; name: string };
    pickup_center?: { id: string; name: string };
  };
  estimateStatus?: EstimateStatus;
  totalVisits: number;
}

export default function RepairDetailView({
  repair,
  estimateStatus,
  totalVisits,
}: RepairDetailViewProps) {
  const router = useRouter();
  const [status, setStatus] = useState<RepairStatus>(repair.status);
  const [locationType, setLocationType] = useState<CurrentLocationType | undefined>(
    repair.current_location_type
  );
  const [centerId, setCenterId] = useState(repair.current_center_id);
  const [centerName, setCenterName] = useState(repair.current_center?.name);
  const [pickupCenterName, setPickupCenterName] = useState(repair.pickup_center?.name);

  const handleRepairUpdated = (updated: RepairUpdatePayload) => {
    if (updated.status) setStatus(updated.status);
    if (updated.current_location_type) setLocationType(updated.current_location_type);
    if (updated.current_center_id !== undefined) {
      setCenterId(updated.current_center_id ?? undefined);
    }
    if (updated.current_center !== undefined) {
      setCenterName(updated.current_center?.name);
      if (updated.current_center?.id) {
        setCenterId(updated.current_center.id);
      }
    }
    if (updated.pickup_center !== undefined) {
      setPickupCenterName(updated.pickup_center?.name);
    }
    router.refresh();
  };

  return (
    <Box>
      <RepairDetailSummary
        repair={repair}
        status={status}
        locationType={locationType}
        centerName={centerName}
        pickupCenterName={pickupCenterName}
        totalVisits={totalVisits}
        estimateStatus={estimateStatus}
      />

      <ContentCard title="Repair Progress" sx={{ mb: 3 }}>
        <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <StatusBadge status={status} />
          {estimateStatus && estimateStatus !== 'Not Required' && (
            <StatusBadge status={estimateStatus} type="estimate" />
          )}
        </Box>
        <RepairStatusStepper
          currentStatus={status}
          size="medium"
          withTooltips
          estimateStatus={estimateStatus}
        />
      </ContentCard>

      <RepairDetailTracking
        repairId={repair.id}
        repair={repair}
        currentCenterId={centerId}
        currentLocationType={locationType}
        currentCenterName={centerName}
        pickupCenterName={pickupCenterName}
        receivingCenter={repair.receiving_center}
        onRepairUpdated={handleRepairUpdated}
      />

      <Box sx={{ mt: 1 }}>
        <RepairDetailSections repair={repair} estimateStatus={estimateStatus} />
      </Box>
    </Box>
  );
}
