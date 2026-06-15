'use client';

import { useRouter } from 'next/navigation';
import { Box, Chip, Stack, Typography } from '@mui/material';
import type { PatientVisitRepair } from '@/app/components/PatientVisitHistory';
import StatusBadge from '@/app/components/ui/StatusBadge';

interface VisitSelectorProps {
  repairs: PatientVisitRepair[];
  currentRepairId: string;
}

function formatVisitDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function VisitSelector({ repairs, currentRepairId }: VisitSelectorProps) {
  const router = useRouter();

  if (repairs.length <= 1) {
    return null;
  }

  return (
    <Box
      sx={{
        mt: 2.5,
        pt: 2.5,
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={1}
        sx={{ mb: 1.5 }}
      >
        <Typography variant="subtitle2" fontWeight={700}>
          Choose visit
        </Typography>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          {repairs.length} visits
        </Typography>
      </Stack>

      <Box
        sx={{
          display: 'flex',
          gap: 1,
          overflowX: 'auto',
          pb: 0.5,
          '&::-webkit-scrollbar': { height: 6 },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#bdbdbd',
            borderRadius: 3,
          },
        }}
      >
        {repairs.map((visit, index) => {
          const isCurrent = visit.id === currentRepairId;
          const visitLabel = visit.visit_number ?? index + 1;

          return (
            <Chip
              key={visit.id}
              clickable={!isCurrent}
              onClick={() => {
                if (!isCurrent) {
                  router.push(`/dashboard/repairs/${visit.id}`);
                }
              }}
              label={
                <Box sx={{ textAlign: 'left', py: 0.25 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                    <Typography variant="caption" fontWeight={700} display="block" lineHeight={1.2}>
                      Visit {visitLabel}
                    </Typography>
                    <StatusBadge status={visit.status} size="small" />
                  </Stack>
                  <Typography
                    variant="caption"
                    display="block"
                    sx={{
                      fontFamily: 'monospace',
                      opacity: 0.9,
                      lineHeight: 1.2,
                      mt: 0.5,
                    }}
                  >
                    {visit.repair_id}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ opacity: 0.75, lineHeight: 1.2 }}>
                    {visit.model_item_name} · {formatVisitDate(visit.created_at)}
                  </Typography>
                </Box>
              }
              sx={{
                height: 'auto',
                py: 1,
                px: 0.5,
                minWidth: 180,
                borderRadius: 2,
                border: '1px solid',
                borderColor: isCurrent ? 'primary.main' : 'divider',
                bgcolor: isCurrent ? 'rgba(238, 100, 23, 0.1)' : 'background.paper',
                color: isCurrent ? 'primary.main' : 'text.primary',
                '& .MuiChip-label': {
                  display: 'block',
                  whiteSpace: 'normal',
                  px: 1.25,
                },
                '&:hover': isCurrent
                  ? undefined
                  : {
                      bgcolor: 'rgba(238, 100, 23, 0.06)',
                      borderColor: 'rgba(238, 100, 23, 0.35)',
                    },
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
}
