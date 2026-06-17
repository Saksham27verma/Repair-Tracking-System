'use client';

import {
  Box,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { AccessTime as TimeIcon } from '@mui/icons-material';
import ContentCard from '@/app/components/ui/ContentCard';
import {
  RepairTimingReport as RepairTimingReportData,
  TIMED_STAGES,
  formatDurationDays,
  formatDurationMs,
} from '@/lib/repair-timing';

interface RepairTimingReportProps {
  timing: RepairTimingReportData;
  compact?: boolean;
}

const STAGE_COLORS = ['#EE6417', '#2196f3', '#3aa986', '#9c27b0'];

function formatTimestamp(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function RepairTimingReport({
  timing,
  compact = false,
}: RepairTimingReportProps) {
  const activeStages = timing.stages.filter(
    (stage) => stage.hasStarted && stage.status !== 'Completed'
  );
  const timedStages = activeStages.filter((stage) => stage.durationMs != null);
  const totalForBars = timedStages.reduce(
    (sum, stage) => sum + (stage.durationMs ?? 0),
    0
  );

  return (
    <ContentCard title="Repair Time Analysis" sx={{ mb: 3 }}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3,
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1.5,
            borderRadius: 2,
            bgcolor: 'action.hover',
          }}
        >
          <TimeIcon color="primary" fontSize="small" />
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Total repair time
            </Typography>
            <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
              {formatDurationDays(timing.totalDurationMs)}
            </Typography>
          </Box>
        </Box>

        <Chip
          size="small"
          label={timing.isComplete ? 'Completed' : 'In progress'}
          color={timing.isComplete ? 'success' : 'warning'}
          variant="outlined"
        />

        {!compact && timing.startedAt && (
          <Typography variant="body2" color="text.secondary">
            Started {formatTimestamp(timing.startedAt)}
            {timing.completedAt
              ? ` · Finished ${formatTimestamp(timing.completedAt)}`
              : ''}
          </Typography>
        )}
      </Box>

      {totalForBars > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={600}
            display="block"
            sx={{ mb: 1.5 }}
          >
            TIME BY STAGE
          </Typography>
          <Box sx={{ display: 'flex', height: 12, borderRadius: 1, overflow: 'hidden' }}>
            {timedStages.map((stage, index) => {
              const width = ((stage.durationMs ?? 0) / totalForBars) * 100;
              if (width <= 0) return null;
              return (
                <Box
                  key={stage.status}
                  sx={{
                    width: `${width}%`,
                    bgcolor: STAGE_COLORS[index % STAGE_COLORS.length],
                    minWidth: width > 0 ? 4 : 0,
                  }}
                  title={`${stage.label}: ${formatDurationMs(stage.durationMs)}`}
                />
              );
            })}
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1.5 }}>
            {timedStages.map((stage, index) => (
              <Box key={stage.status} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: STAGE_COLORS[index % STAGE_COLORS.length],
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {stage.label}: {formatDurationMs(stage.durationMs)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Stage</TableCell>
            <TableCell>Started</TableCell>
            <TableCell>Duration</TableCell>
            <TableCell align="right">Share</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {TIMED_STAGES.map((status) => {
            const stage = timing.stages.find((item) => item.status === status);
            if (!stage) return null;

            const share =
              totalForBars > 0 && stage.durationMs != null
                ? Math.round((stage.durationMs / totalForBars) * 100)
                : 0;

            return (
              <TableRow
                key={status}
                sx={{
                  bgcolor: stage.isCurrent ? 'action.hover' : undefined,
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight={stage.isCurrent ? 700 : 500}>
                      {stage.label}
                    </Typography>
                    {stage.isCurrent && (
                      <Chip label="Current" size="small" color="primary" variant="outlined" />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatTimestamp(stage.startedAt)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {stage.hasStarted ? formatDurationMs(stage.durationMs) : '—'}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ minWidth: 120 }}>
                  {stage.durationMs != null && totalForBars > 0 ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={share}
                        sx={{ flex: 1, height: 6, borderRadius: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 32 }}>
                        {share}%
                      </Typography>
                    </Box>
                  ) : (
                    '—'
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ContentCard>
  );
}
