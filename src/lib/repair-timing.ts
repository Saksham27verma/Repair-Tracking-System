import {
  RepairMovement,
  RepairRecord,
  RepairStatus,
} from '@/app/types/database';
import {
  buildLegacyMovements,
  deriveRepairStateFromMovements,
  getStatusForMovement,
} from '@/lib/tracking';

export const REPAIR_STAGE_ORDER: RepairStatus[] = [
  'Received',
  'Sent to Company for Repair',
  'Returned from Manufacturer',
  'Ready for Pickup',
  'Completed',
];

export const STAGE_SHORT_LABELS: Record<RepairStatus, string> = {
  Received: 'Received',
  'Sent to Company for Repair': 'At Manufacturer',
  'Returned from Manufacturer': 'Returned from Mfr',
  'Ready for Pickup': 'Ready for Pickup',
  Completed: 'With Customer',
};

/** Stages that represent active time windows (excludes terminal Completed) */
export const TIMED_STAGES: RepairStatus[] = REPAIR_STAGE_ORDER.slice(0, -1);

export interface StageTiming {
  status: RepairStatus;
  label: string;
  startedAt: string | null;
  endedAt: string | null;
  durationMs: number | null;
  isCurrent: boolean;
  hasStarted: boolean;
}

export interface RepairTimingReport {
  stages: StageTiming[];
  totalDurationMs: number | null;
  startedAt: string | null;
  completedAt: string | null;
  isComplete: boolean;
  currentStatus: RepairStatus;
}

export interface StageAggregate {
  status: RepairStatus;
  label: string;
  averageMs: number;
  minMs: number;
  maxMs: number;
  sampleCount: number;
}

export interface RepairTimingRow {
  id: string;
  repairId: string;
  patientName: string;
  receivingCenter: string;
  status: RepairStatus;
  timing: RepairTimingReport;
}

function getMovementTimestamp(movement: RepairMovement): string {
  return movement.received_at || movement.shipped_at || movement.created_at;
}

function buildStageTimestampsFromMovements(
  movements: RepairMovement[]
): Partial<Record<RepairStatus, string>> {
  const sorted = [...movements].sort(
    (a, b) =>
      new Date(getMovementTimestamp(a)).getTime() -
      new Date(getMovementTimestamp(b)).getTime()
  );

  const timestamps: Partial<Record<RepairStatus, string>> = {};

  for (const movement of sorted) {
    const status = getStatusForMovement(movement.movement_type);
    if (status && !timestamps[status]) {
      timestamps[status] = getMovementTimestamp(movement);
    }
  }

  if (!timestamps.Received && sorted.length > 0) {
    timestamps.Received = getMovementTimestamp(sorted[0]);
  }

  return timestamps;
}

function buildStageTimestampsFromRepair(
  repair: Partial<RepairRecord>
): Partial<Record<RepairStatus, string>> {
  const timestamps: Partial<Record<RepairStatus, string>> = {};

  if (repair.date_of_receipt) timestamps.Received = repair.date_of_receipt;
  if (repair.date_out_to_manufacturer) {
    timestamps['Sent to Company for Repair'] = repair.date_out_to_manufacturer;
  }
  if (repair.date_received_from_manufacturer) {
    timestamps['Returned from Manufacturer'] = repair.date_received_from_manufacturer;
  }
  if (repair.date_out_to_customer) timestamps.Completed = repair.date_out_to_customer;

  return timestamps;
}

function mergeStageTimestamps(
  fromMovements: Partial<Record<RepairStatus, string>>,
  fromRepair: Partial<Record<RepairStatus, string>>,
  hasRecordedMovements: boolean
): Partial<Record<RepairStatus, string>> {
  if (hasRecordedMovements) {
    return { ...fromRepair, ...fromMovements };
  }
  return { ...fromMovements, ...fromRepair };
}

function getNextStageTimestamp(
  merged: Partial<Record<RepairStatus, string>>,
  fromIndex: number
): string | null {
  for (let i = fromIndex + 1; i < REPAIR_STAGE_ORDER.length; i++) {
    const timestamp = merged[REPAIR_STAGE_ORDER[i]];
    if (timestamp) return timestamp;
  }
  return null;
}

export function formatDurationMs(ms: number | null | undefined): string {
  if (ms == null || ms < 0) return '—';

  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  if (minutes > 0) return `${minutes}m`;
  return '< 1m';
}

export function formatDurationDays(ms: number | null | undefined): string {
  if (ms == null || ms < 0) return '—';
  const days = ms / (1000 * 60 * 60 * 24);
  if (days < 1) return formatDurationMs(ms);
  return `${days.toFixed(1)} days`;
}

export function computeRepairTiming(
  repair: Partial<RepairRecord>,
  recordedMovements: RepairMovement[] = [],
  now: Date = new Date()
): RepairTimingReport {
  const hasRecordedMovements = recordedMovements.length > 0;
  const displayMovements = hasRecordedMovements
    ? recordedMovements
    : buildLegacyMovements(repair);

  const fromMovements = buildStageTimestampsFromMovements(displayMovements);
  const fromRepair = buildStageTimestampsFromRepair(repair);
  const merged = mergeStageTimestamps(
    fromMovements,
    fromRepair,
    hasRecordedMovements
  );

  const derived = deriveRepairStateFromMovements(displayMovements);
  const currentStatus =
    derived.status || (repair.status as RepairStatus) || 'Received';

  const stages: StageTiming[] = REPAIR_STAGE_ORDER.map((status, index) => {
    const startedAt = merged[status] ?? null;
    const endedAt = getNextStageTimestamp(merged, index);
    const isCurrent = status === currentStatus;
    const hasStarted = Boolean(startedAt);

    let durationMs: number | null = null;
    if (startedAt && status !== 'Completed') {
      const endDate = endedAt ? new Date(endedAt) : isCurrent ? now : null;

      if (endDate) {
        durationMs = Math.max(
          0,
          endDate.getTime() - new Date(startedAt).getTime()
        );
      }
    }

    return {
      status,
      label: STAGE_SHORT_LABELS[status],
      startedAt,
      endedAt,
      durationMs,
      isCurrent,
      hasStarted,
    };
  });

  const repairStart = merged.Received ?? repair.date_of_receipt ?? null;
  const repairEnd = merged.Completed ?? null;
  const isComplete = currentStatus === 'Completed' && Boolean(repairEnd);

  let totalDurationMs: number | null = null;
  if (repairStart) {
    const end = isComplete && repairEnd ? new Date(repairEnd) : now;
    totalDurationMs = Math.max(0, end.getTime() - new Date(repairStart).getTime());
  }

  return {
    stages,
    totalDurationMs,
    startedAt: repairStart,
    completedAt: repairEnd,
    isComplete,
    currentStatus,
  };
}

export function computeStageAggregates(
  reports: RepairTimingReport[]
): StageAggregate[] {
  const buckets = new Map<
    RepairStatus,
    { total: number; min: number; max: number; count: number }
  >();

  for (const status of TIMED_STAGES) {
    buckets.set(status, { total: 0, min: Infinity, max: 0, count: 0 });
  }

  for (const report of reports) {
    for (const stage of report.stages) {
      if (stage.status === 'Completed' || stage.durationMs == null) continue;
      const bucket = buckets.get(stage.status);
      if (!bucket) continue;
      bucket.total += stage.durationMs;
      bucket.min = Math.min(bucket.min, stage.durationMs);
      bucket.max = Math.max(bucket.max, stage.durationMs);
      bucket.count += 1;
    }
  }

  return TIMED_STAGES.map((status) => {
    const bucket = buckets.get(status)!;
    return {
      status,
      label: STAGE_SHORT_LABELS[status],
      averageMs: bucket.count > 0 ? Math.round(bucket.total / bucket.count) : 0,
      minMs: bucket.count > 0 ? bucket.min : 0,
      maxMs: bucket.count > 0 ? bucket.max : 0,
      sampleCount: bucket.count,
    };
  });
}

export function getStageDuration(
  report: RepairTimingReport,
  status: RepairStatus
): number | null {
  return report.stages.find((stage) => stage.status === status)?.durationMs ?? null;
}
