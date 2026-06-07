'use client';

import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
} from '@mui/material';
import {
  Store as CenterIcon,
  LocalShipping as TransitIcon,
  Factory as ManufacturerIcon,
  Person as CustomerIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import {
  RepairMovement,
  MOVEMENT_TYPE_LABELS,
  LocationType,
} from '@/app/types/database';

interface MovementTimelineProps {
  movements: RepairMovement[];
  compact?: boolean;
}

function getLocationName(movement: RepairMovement, side: 'from' | 'to'): string {
  if (side === 'from') {
    if (movement.from_center?.name) return movement.from_center.name;
    if (movement.from_location_type === 'manufacturer') return 'Manufacturer';
    if (movement.from_location_type === 'customer') return 'Customer';
    if (movement.from_location_type === 'in_transit') return 'In Transit';
    return '—';
  }
  if (movement.to_center?.name) return movement.to_center.name;
  if (movement.to_location_type === 'manufacturer') return 'Manufacturer';
  if (movement.to_location_type === 'customer') return 'Customer';
  if (movement.to_location_type === 'in_transit') return 'In Transit';
  return '—';
}

function getStepIcon(locationType?: LocationType) {
  switch (locationType) {
    case 'center':
      return <CenterIcon />;
    case 'manufacturer':
      return <ManufacturerIcon />;
    case 'customer':
      return <CustomerIcon />;
    case 'in_transit':
      return <TransitIcon />;
    default:
      return <CheckIcon />;
  }
}

function formatDate(date?: string) {
  if (!date) return null;
  return new Date(date).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MovementTimeline({ movements, compact = false }: MovementTimelineProps) {
  if (!movements.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
        No movement history recorded yet.
      </Typography>
    );
  }

  const sorted = [...movements].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  if (compact) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {sorted.map((movement, index) => (
          <Box
            key={movement.id}
            sx={{
              display: 'flex',
              gap: 2,
              position: 'relative',
              pl: 3,
              '&::before': index < sorted.length - 1 ? {
                content: '""',
                position: 'absolute',
                left: 7,
                top: 24,
                bottom: -16,
                width: 2,
                bgcolor: 'divider',
              } : {},
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                top: 4,
                width: 16,
                height: 16,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                border: '3px solid',
                borderColor: 'background.paper',
                boxShadow: '0 0 0 2px',
                boxShadowColor: 'primary.light',
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                {MOVEMENT_TYPE_LABELS[movement.movement_type]}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {getLocationName(movement, 'from')} → {getLocationName(movement, 'to')}
              </Typography>
              {movement.tracking_number && (
                <Typography variant="caption" display="block" color="text.secondary">
                  AWB: {movement.tracking_number}
                </Typography>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Stepper orientation="vertical" activeStep={sorted.length} nonLinear>
      {sorted.map((movement) => {
        const date = formatDate(movement.received_at || movement.shipped_at || movement.created_at);
        return (
          <Step key={movement.id} completed active>
            <StepLabel
              StepIconComponent={() => (
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(238,100,23,0.3)',
                  }}
                >
                  {getStepIcon(movement.to_location_type)}
                </Box>
              )}
            >
              <Box>
                <Typography variant="body1" fontWeight={600}>
                  {MOVEMENT_TYPE_LABELS[movement.movement_type]}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {getLocationName(movement, 'from')} → {getLocationName(movement, 'to')}
                </Typography>
              </Box>
            </StepLabel>
            <StepContent>
              <Box sx={{ pb: 2 }}>
                {date && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    {date}
                  </Typography>
                )}
                {movement.carrier && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Carrier: {movement.carrier}
                  </Typography>
                )}
                {movement.tracking_number && (
                  <Chip
                    label={`AWB: ${movement.tracking_number}`}
                    size="small"
                    sx={{ mt: 0.5, fontSize: '0.7rem' }}
                  />
                )}
                {movement.notes && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                    {movement.notes}
                  </Typography>
                )}
              </Box>
            </StepContent>
          </Step>
        );
      })}
    </Stepper>
  );
}
