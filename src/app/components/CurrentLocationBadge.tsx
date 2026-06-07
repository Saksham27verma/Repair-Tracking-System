'use client';

import { Chip } from '@mui/material';
import {
  Store as CenterIcon,
  LocalShipping as TransitIcon,
  Factory as ManufacturerIcon,
  Person as CustomerIcon,
} from '@mui/icons-material';
import { CurrentLocationType } from '@/app/types/database';
import { getLocationLabel } from '@/lib/tracking';

interface CurrentLocationBadgeProps {
  locationType?: CurrentLocationType;
  centerName?: string;
  inTransitTo?: string;
  size?: 'small' | 'medium';
}

const LOCATION_COLORS: Record<CurrentLocationType, string> = {
  at_center: '#3aa986',
  in_transit: '#F59E0B',
  at_manufacturer: '#3B82F6',
  with_customer: '#10B981',
};

const LOCATION_ICONS: Record<CurrentLocationType, React.ReactElement> = {
  at_center: <CenterIcon sx={{ fontSize: 16 }} />,
  in_transit: <TransitIcon sx={{ fontSize: 16 }} />,
  at_manufacturer: <ManufacturerIcon sx={{ fontSize: 16 }} />,
  with_customer: <CustomerIcon sx={{ fontSize: 16 }} />,
};

export default function CurrentLocationBadge({
  locationType,
  centerName,
  inTransitTo,
  size = 'medium',
}: CurrentLocationBadgeProps) {
  if (!locationType) return null;

  const label = getLocationLabel(locationType, centerName, inTransitTo);
  const color = LOCATION_COLORS[locationType] || '#64748B';

  return (
    <Chip
      icon={LOCATION_ICONS[locationType]}
      label={label}
      size={size}
      sx={{
        bgcolor: `${color}18`,
        color,
        fontWeight: 600,
        border: 'none',
        '& .MuiChip-icon': { color },
      }}
    />
  );
}
