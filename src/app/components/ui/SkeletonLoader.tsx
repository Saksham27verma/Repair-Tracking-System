'use client';

import { Box, Skeleton, Grid } from '@mui/material';

interface SkeletonLoaderProps {
  variant?: 'cards' | 'table' | 'detail';
  count?: number;
}

export default function SkeletonLoader({ variant = 'cards', count = 4 }: SkeletonLoaderProps) {
  if (variant === 'cards') {
    return (
      <Grid container spacing={3}>
        {Array.from({ length: count }).map((_, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (variant === 'table') {
    return (
      <Box>
        <Skeleton variant="rounded" height={56} sx={{ mb: 2, borderRadius: 2 }} />
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={52} sx={{ mb: 1, borderRadius: 1 }} />
        ))}
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={7}>
        <Skeleton variant="rounded" height={400} sx={{ borderRadius: 3 }} />
      </Grid>
      <Grid item xs={12} md={5}>
        <Skeleton variant="rounded" height={400} sx={{ borderRadius: 3 }} />
      </Grid>
    </Grid>
  );
}
