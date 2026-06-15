'use client';

import Link from 'next/link';
import { Box, Divider, List, ListItem, ListItemText, Typography } from '@mui/material';
import { RepairStatus } from '@/app/types/database';
import StatusBadge from '@/app/components/ui/StatusBadge';

export interface PatientVisitRepair {
  id: string;
  repair_id: string;
  visit_number?: number | null;
  created_at: string;
  status: RepairStatus | string;
  model_item_name: string;
}

interface PatientVisitHistoryProps {
  repairs: PatientVisitRepair[];
  currentRepairId?: string;
}

function formatVisitDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function PatientVisitHistory({ repairs, currentRepairId }: PatientVisitHistoryProps) {
  if (repairs.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
        No previous visits
      </Typography>
    );
  }

  return (
    <List disablePadding sx={{ mt: 1 }}>
      {repairs.map((visit, index) => {
        const isCurrent = visit.id === currentRepairId;

        return (
          <Box key={visit.id}>
            {index > 0 && <Divider />}
            <ListItem
              component={isCurrent ? 'div' : Link}
              href={isCurrent ? undefined : `/dashboard/repairs/${visit.id}`}
              disableGutters
              sx={{
                py: 1.25,
                px: 0,
                cursor: isCurrent ? 'default' : 'pointer',
                textDecoration: 'none',
                color: 'inherit',
                borderRadius: 1,
                bgcolor: isCurrent ? 'rgba(238, 100, 23, 0.06)' : 'transparent',
                '&:hover': isCurrent ? undefined : { bgcolor: 'grey.50' },
              }}
            >
              <ListItemText
                primary={
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 1,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          bgcolor: isCurrent ? 'primary.main' : 'secondary.main',
                          color: 'white',
                          px: 1,
                          py: 0.25,
                          borderRadius: 1,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        Visit {visit.visit_number ?? index + 1}
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        color={isCurrent ? 'text.primary' : 'primary.main'}
                        sx={{ fontFamily: 'monospace' }}
                      >
                        {visit.repair_id}
                      </Typography>
                      {isCurrent && (
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          (current)
                        </Typography>
                      )}
                    </Box>
                    <StatusBadge status={visit.status} size="small" />
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {visit.model_item_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatVisitDate(visit.created_at)}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          </Box>
        );
      })}
    </List>
  );
}
