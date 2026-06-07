'use client';

import { useState, ReactNode } from 'react';
import { Box, Collapse, IconButton, Paper, Typography } from '@mui/material';
import { FilterList as FilterIcon, ExpandMore as ExpandIcon } from '@mui/icons-material';

interface FilterBarProps {
  children: ReactNode;
  defaultExpanded?: boolean;
  activeFilterCount?: number;
}

export default function FilterBar({ children, defaultExpanded = true, activeFilterCount = 0 }: FilterBarProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          bgcolor: '#FAFBFC',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterIcon sx={{ color: 'primary.main', fontSize: 20 }} />
          <Typography variant="body2" fontWeight={600}>
            Filters
          </Typography>
          {activeFilterCount > 0 && (
            <Typography
              variant="caption"
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                px: 1,
                py: 0.25,
                borderRadius: 10,
                fontWeight: 600,
              }}
            >
              {activeFilterCount}
            </Typography>
          )}
        </Box>
        <IconButton size="small" sx={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: '0.2s' }}>
          <ExpandIcon />
        </IconButton>
      </Box>
      <Collapse in={expanded}>
        <Box sx={{ p: 2.5, pt: 1 }}>{children}</Box>
      </Collapse>
    </Paper>
  );
}
