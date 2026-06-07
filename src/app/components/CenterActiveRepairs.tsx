'use client';

import { Box, Grid, Typography, Chip, LinearProgress } from '@mui/material';
import { Store as StoreIcon, LocalShipping as TransitIcon, Factory as MfrIcon } from '@mui/icons-material';
import Link from 'next/link';
import ContentCard from '@/app/components/ui/ContentCard';

export interface CenterActiveStats {
  center_id: string;
  center_name: string;
  devices_at_center: number;
  active_repairs: number;
  at_manufacturer: number;
  in_transit: number;
  status_breakdown: { status: string; count: number }[];
}

interface CenterActiveRepairsProps {
  centers: CenterActiveStats[];
}

export default function CenterActiveRepairs({ centers }: CenterActiveRepairsProps) {
  const totalActive = centers.reduce((s, c) => s + c.active_repairs, 0);

  if (!centers.length) return null;

  return (
    <ContentCard title={`Active Repairs by Center (${totalActive} total)`} sx={{ mb: 4 }}>
      <Grid container spacing={2}>
        {centers.map((center) => (
          <Grid item xs={12} sm={6} md={3} key={center.center_id}>
            <Box
              component={Link}
              href={`/dashboard/repairs?center=${center.center_id}`}
              sx={{
                display: 'block',
                p: 2.5,
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: center.active_repairs > 0 ? 'primary.main' : 'divider',
                bgcolor: center.active_repairs > 0 ? 'rgba(238,100,23,0.04)' : '#FAFBFC',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.2s',
                '&:hover': {
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <StoreIcon sx={{ color: 'primary.main' }} />
                <Typography variant="subtitle2" fontWeight={700}>
                  {center.center_name}
                </Typography>
              </Box>

              <Typography variant="h4" fontWeight={800} color="primary.main" sx={{ mb: 0.5 }}>
                {center.active_repairs}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                active repair{center.active_repairs !== 1 ? 's' : ''}
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
                {center.devices_at_center > 0 && (
                  <Chip
                    icon={<StoreIcon />}
                    label={`${center.devices_at_center} at center`}
                    size="small"
                    sx={{ fontSize: '0.7rem', height: 22 }}
                  />
                )}
                {center.in_transit > 0 && (
                  <Chip
                    icon={<TransitIcon />}
                    label={`${center.in_transit} in transit`}
                    size="small"
                    color="warning"
                    sx={{ fontSize: '0.7rem', height: 22 }}
                  />
                )}
                {center.at_manufacturer > 0 && (
                  <Chip
                    icon={<MfrIcon />}
                    label={`${center.at_manufacturer} at mfr`}
                    size="small"
                    color="info"
                    sx={{ fontSize: '0.7rem', height: 22 }}
                  />
                )}
              </Box>

              {center.status_breakdown.length > 0 && (
                <Box>
                  {center.status_breakdown.slice(0, 3).map((s) => (
                    <Box key={s.status} sx={{ mb: 0.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: '70%' }}>
                          {s.status}
                        </Typography>
                        <Typography variant="caption" fontWeight={600}>{s.count}</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={center.active_repairs > 0 ? (s.count / center.active_repairs) * 100 : 0}
                        sx={{ height: 3, borderRadius: 2, bgcolor: '#E2E8F0' }}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Grid>
        ))}
      </Grid>
    </ContentCard>
  );
}
