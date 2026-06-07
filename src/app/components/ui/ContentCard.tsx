'use client';

import { Paper, Typography, Box, SxProps, Theme } from '@mui/material';
import { ReactNode } from 'react';

interface ContentCardProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  sx?: SxProps<Theme>;
  noPadding?: boolean;
}

export default function ContentCard({ title, action, children, sx, noPadding }: ContentCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden',
        ...sx,
      }}
    >
      {title && (
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="h6" fontWeight={600} sx={{ fontSize: '1rem' }}>
            {title}
          </Typography>
          {action}
        </Box>
      )}
      <Box sx={{ p: noPadding ? 0 : 3 }}>{children}</Box>
    </Paper>
  );
}
