'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box } from '@mui/material';
import {
  EstimateStatus,
  RepairMovement,
  RepairRecord,
} from '@/app/types/database';
import ContentCard from '@/app/components/ui/ContentCard';
import StatusBadge from '@/app/components/ui/StatusBadge';
import RepairStatusStepper from '@/app/components/RepairStatusStepper';
import RepairDetailTracking from './RepairDetailTracking';
import RepairDetailSummary from './RepairDetailSummary';
import RepairDetailSections from './RepairDetailSections';
import RepairEstimateSetup from '@/app/components/RepairEstimateSetup';
import StaffEstimateApproval from '@/app/components/StaffEstimateApproval';
import SendEstimateApprovalDialog from '@/app/components/SendEstimateApprovalDialog';
import {
  RepairUpdatePayload,
  getEffectiveTrackingState,
  type EffectiveTrackingState,
} from '@/lib/tracking';
import { computeRepairTiming } from '@/lib/repair-timing';
import RepairTimingReport from '@/app/components/RepairTimingReport';
import type { CustomerVisitStats } from '@/lib/customer-visits';

interface RepairDetailViewProps {
  repair: RepairRecord & {
    current_center?: { id: string; name: string };
    pickup_center?: { id: string; name: string };
  };
  estimateStatus?: EstimateStatus;
  visitStats: CustomerVisitStats | null;
  onRepairRefresh?: () => Promise<void>;
}

export default function RepairDetailView({
  repair,
  estimateStatus,
  visitStats,
  onRepairRefresh,
}: RepairDetailViewProps) {
  const router = useRouter();
  const [movements, setMovements] = useState<RepairMovement[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(true);
  const [trackingState, setTrackingState] = useState<EffectiveTrackingState>(() =>
    getEffectiveTrackingState(repair, [])
  );

  const fetchMovements = useCallback(async () => {
    try {
      const res = await fetch(`/api/repairs/${repair.id}/movements`);
      if (res.ok) {
        const data = await res.json();
        setMovements(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch movements:', err);
    } finally {
      setMovementsLoading(false);
    }
  }, [repair.id]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  useEffect(() => {
    setTrackingState(getEffectiveTrackingState(repair, movements));
  }, [repair, movements]);

  useEffect(() => {
    if (!movementsLoading && movements.length > 0) {
      const state = getEffectiveTrackingState(repair, movements);
      if (state.isOutOfSync) {
        fetch(`/api/repairs/${repair.id}/sync-tracking`, { method: 'POST' })
          .then((res) => (res.ok ? router.refresh() : null))
          .catch(() => undefined);
      }
    }
  }, [movementsLoading, movements, repair, router]);

  const handleRepairUpdated = async (updated: RepairUpdatePayload) => {
    await fetchMovements();
    await onRepairRefresh?.();
    router.refresh();
    if (updated) {
      setTrackingState(
        getEffectiveTrackingState(
          {
            ...repair,
            status: updated.status ?? repair.status,
            current_location_type:
              updated.current_location_type ?? repair.current_location_type,
            current_center_id:
              updated.current_center_id !== undefined
                ? updated.current_center_id ?? undefined
                : repair.current_center_id,
            current_center: updated.current_center ?? repair.current_center,
            pickup_center: updated.pickup_center ?? repair.pickup_center,
          },
          movements
        )
      );
    }
  };

  const status = trackingState.status;
  const locationType = trackingState.locationType;
  const centerName = trackingState.centerName;
  const pickupCenterName = trackingState.pickupCenterName;

  const beforeManufacturerReturn =
    status === 'Sent to Company for Repair' && !repair.date_received_from_manufacturer;
  const hasCustomerQuote =
    Boolean(repair.repair_estimate_by_company && repair.repair_estimate_by_company > 0);
  const needsQuoteSetup =
    beforeManufacturerReturn &&
    !hasCustomerQuote &&
    estimateStatus !== 'Approved' &&
    estimateStatus !== 'Declined';
  const showEstimateWorkflow =
    beforeManufacturerReturn && (needsQuoteSetup || hasCustomerQuote);

  const repairTiming = computeRepairTiming(
    repair,
    trackingState.hasRecordedMovements ? movements : []
  );

  return (
    <Box>
      <RepairDetailSummary
        repair={repair}
        status={status}
        locationType={locationType}
        centerName={centerName}
        pickupCenterName={pickupCenterName}
        totalVisits={visitStats?.totalVisits ?? 0}
        visitRepairs={visitStats?.repairs}
        estimateStatus={estimateStatus}
      />

      {trackingState.isOutOfSync && trackingState.syncMessage && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {trackingState.syncMessage}
        </Alert>
      )}

      <ContentCard title="Repair Progress" sx={{ mb: 3 }}>
        <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <StatusBadge status={status} />
        </Box>
        <RepairStatusStepper
          currentStatus={status}
          size="medium"
          withTooltips
          estimateStatus={estimateStatus}
        />
      </ContentCard>

      <RepairTimingReport timing={repairTiming} />

      {showEstimateWorkflow && needsQuoteSetup && (
        <RepairEstimateSetup
          repairId={repair.id}
          existingManufacturerEstimate={repair.manufacturer_invoice_estimate}
          existingMarkup={repair.estimate_by_us}
          onSaved={async () => {
            await onRepairRefresh?.();
            router.refresh();
          }}
        />
      )}

      {beforeManufacturerReturn &&
        needsQuoteSetup &&
        estimateStatus !== 'Approved' &&
        estimateStatus !== 'Declined' && (
          <Box sx={{ mb: 3 }}>
            <SendEstimateApprovalDialog
              repairId={repair.id}
              repairPublicId={repair.repair_id}
              status={status}
              patientName={repair.patient_name}
              patientEmail={repair.email}
              manufacturerEstimate={repair.manufacturer_invoice_estimate}
              hopeMarkup={repair.estimate_by_us}
              customerQuote={repair.repair_estimate_by_company}
              estimateStatus={estimateStatus}
              requestSentAt={repair.estimate_approval_request_sent_at}
              onSent={async () => {
                await onRepairRefresh?.();
                router.refresh();
              }}
            />
          </Box>
        )}

      {showEstimateWorkflow && hasCustomerQuote && estimateStatus && (
        <StaffEstimateApproval
          repairId={repair.id}
          repairPublicId={repair.repair_id}
          patientName={repair.patient_name}
          estimate={repair.repair_estimate_by_company!}
          estimateStatus={estimateStatus}
          estimateApprovedBy={repair.estimate_approved_by}
          estimateApprovalDate={repair.estimate_approval_date}
          patientEmail={repair.email}
          manufacturerEstimate={repair.manufacturer_invoice_estimate}
          hopeMarkup={repair.estimate_by_us}
          requestSentAt={repair.estimate_approval_request_sent_at}
          beforeReturn
          onApproved={async () => {
            await onRepairRefresh?.();
            router.refresh();
          }}
        />
      )}

      <RepairDetailTracking
        repairId={repair.id}
        repair={repair}
        trackingState={trackingState}
        movementsLoading={movementsLoading}
        onRepairUpdated={handleRepairUpdated}
        onMovementsRefresh={fetchMovements}
      />

      <Box sx={{ mt: 1 }}>
        <RepairDetailSections repair={repair} estimateStatus={estimateStatus} />
      </Box>
    </Box>
  );
}
