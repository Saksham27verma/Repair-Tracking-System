'use client';

import { useState } from 'react';
import { Box, Typography, Chip, Paper, Divider, IconButton, Tooltip, CircularProgress } from '@mui/material';
import {
  Store as CenterIcon,
  LocalShipping as TransitIcon,
  Factory as ManufacturerIcon,
  Person as PersonIcon,
  ArrowForward as ArrowIcon,
  DeleteOutline as DeleteIcon,
} from '@mui/icons-material';
import {
  RepairMovement,
  MOVEMENT_TYPE_LABELS,
  LocationType,
} from '@/app/types/database';
import { getMovementLocationName, buildJourneySummary } from '@/lib/tracking';

interface DeviceJourneyTimelineProps {
  movements: RepairMovement[];
  highlightLatest?: boolean;
  onDeleteMovement?: (movementId: string) => Promise<void>;
}

function isDeletableMovement(movement: RepairMovement): boolean {
  return Boolean(movement.id) && !movement.id.startsWith('legacy-');
}

const LOCATION_ICONS: Record<string, React.ReactNode> = {
  center: <CenterIcon fontSize="small" />,
  manufacturer: <ManufacturerIcon fontSize="small" />,
  customer: <PersonIcon fontSize="small" />,
  in_transit: <TransitIcon fontSize="small" />,
};

function formatDateTime(date?: string) {
  if (!date) return null;
  return new Date(date).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function LocationPill({
  name,
  type,
}: {
  name: string;
  type?: LocationType;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.5,
        py: 0.75,
        borderRadius: 2,
        bgcolor: '#F8FAFC',
        border: '1px solid #E2E8F0',
        minWidth: 0,
      }}
    >
      <Box sx={{ color: 'primary.main', display: 'flex' }}>
        {LOCATION_ICONS[type || 'center'] || <CenterIcon fontSize="small" />}
      </Box>
      <Typography variant="body2" fontWeight={600} noWrap>
        {name}
      </Typography>
    </Box>
  );
}

export default function DeviceJourneyTimeline({
  movements,
  highlightLatest = true,
  onDeleteMovement,
}: DeviceJourneyTimelineProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (movement: RepairMovement) => {
    if (!onDeleteMovement || !isDeletableMovement(movement)) return;

    const label = MOVEMENT_TYPE_LABELS[movement.movement_type];
    if (!window.confirm(`Delete this journey step (${label})? The repair status and location will be updated.`)) {
      return;
    }

    setDeletingId(movement.id);
    try {
      await onDeleteMovement(movement.id);
    } finally {
      setDeletingId(null);
    }
  };

  if (!movements.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
        No movement history recorded yet. Log the first transfer to start tracking this device.
      </Typography>
    );
  }

  const sorted = [...movements].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const summary = buildJourneySummary(sorted);

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          bgcolor: 'rgba(238, 100, 23, 0.06)',
          border: '1px solid rgba(238, 100, 23, 0.15)',
        }}
      >
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          FULL JOURNEY
        </Typography>
        <Typography variant="body1" fontWeight={700} sx={{ mt: 0.5, letterSpacing: '-0.01em' }}>
          {summary}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {sorted.length} movement{sorted.length !== 1 ? 's' : ''} recorded
        </Typography>
      </Paper>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {sorted.map((movement, index) => {
          const isLatest = highlightLatest && index === sorted.length - 1;
          const fromName = getMovementLocationName(movement, 'from');
          const toName = getMovementLocationName(movement, 'to');
          const eventDate = formatDateTime(
            movement.received_at || movement.shipped_at || movement.created_at
          );

          return (
            <Box key={movement.id} sx={{ display: 'flex', gap: 2 }}>
              {/* Timeline rail */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: isLatest ? 'primary.main' : '#E2E8F0',
                    color: isLatest ? 'white' : 'text.secondary',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    boxShadow: isLatest ? '0 2px 8px rgba(238,100,23,0.35)' : 'none',
                    zIndex: 1,
                  }}
                >
                  {index + 1}
                </Box>
                {index < sorted.length - 1 && (
                  <Box sx={{ width: 2, flex: 1, minHeight: 24, bgcolor: 'divider', my: 0.5 }} />
                )}
              </Box>

              {/* Step card */}
              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  mb: 2,
                  p: 2,
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: isLatest ? 'primary.main' : 'divider',
                  bgcolor: isLatest ? 'rgba(238,100,23,0.03)' : 'background.paper',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {MOVEMENT_TYPE_LABELS[movement.movement_type]}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {isLatest && (
                      <Chip label="Current step" size="small" color="primary" sx={{ fontWeight: 600, height: 22 }} />
                    )}
                    {onDeleteMovement && isDeletableMovement(movement) && (
                      <Tooltip title="Delete this step">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(movement)}
                            disabled={deletingId === movement.id}
                            aria-label="Delete journey step"
                          >
                            {deletingId === movement.id ? (
                              <CircularProgress size={16} />
                            ) : (
                              <DeleteIcon fontSize="small" />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </Box>
                </Box>

                {/* Route visualization */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                  <LocationPill name={fromName} type={movement.from_location_type} />
                  <ArrowIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                  <LocationPill name={toName} type={movement.to_location_type} />
                </Box>

                <Divider sx={{ my: 1.5 }} />

                {/* Details grid */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
                  {eventDate && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Date & Time</Typography>
                      <Typography variant="body2" fontWeight={500}>{eventDate}</Typography>
                    </Box>
                  )}
                  {movement.shipped_at && movement.shipped_at !== movement.received_at && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Shipped</Typography>
                      <Typography variant="body2" fontWeight={500}>{formatDateTime(movement.shipped_at)}</Typography>
                    </Box>
                  )}
                  {movement.expected_arrival && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Expected Arrival</Typography>
                      <Typography variant="body2" fontWeight={500}>{formatDateTime(movement.expected_arrival)}</Typography>
                    </Box>
                  )}
                  {movement.carrier && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Carrier</Typography>
                      <Typography variant="body2" fontWeight={500}>{movement.carrier}</Typography>
                    </Box>
                  )}
                  {movement.tracking_number && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Tracking No. (AWB)</Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ color: 'primary.main' }}>
                        {movement.tracking_number}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {movement.notes && (
                  <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 1.5, bgcolor: '#F8FAFC' }}>
                    <Typography variant="caption" color="text.secondary">Notes</Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>{movement.notes}</Typography>
                  </Box>
                )}
              </Paper>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
