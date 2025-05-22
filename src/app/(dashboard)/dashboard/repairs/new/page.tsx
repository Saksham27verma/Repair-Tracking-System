'use client';

import { Box, Typography } from '@mui/material';
import RepairForm from '../_components/RepairForm';

export default function NewRepairPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        New Repair
      </Typography>
      <RepairForm />
    </Box>
  );
} 