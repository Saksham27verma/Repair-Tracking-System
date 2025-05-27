'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormControlLabel,
  Switch,
  TextField,
  Card,
  CardContent
} from '@mui/material';
import RepairStatusStepper from './RepairStatusStepper';
import { RepairStatus, EstimateStatus } from '@/app/types/database';

export default function RepairStatusStepperDemo() {
  // State for the demo controls
  const [currentStatus, setCurrentStatus] = useState<RepairStatus>('Received');
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [showLabels, setShowLabels] = useState(true);
  const [withTooltips, setWithTooltips] = useState(true);
  const [estimateStatus, setEstimateStatus] = useState<EstimateStatus | undefined>(undefined);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Repair Status Stepper Demo
        </Typography>
        <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
          <TextField
            select
            label="Current Status"
            value={currentStatus}
            onChange={(e) => setCurrentStatus(e.target.value as RepairStatus)}
            fullWidth
            sx={{ mb: 2 }}
          >
            <MenuItem value="Received">Received</MenuItem>
            <MenuItem value="Sent to Company for Repair">Sent to Company for Repair</MenuItem>
            <MenuItem value="Returned from Manufacturer">Returned from Manufacturer</MenuItem>
            <MenuItem value="Ready for Pickup">Ready for Pickup</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
          </TextField>
          <TextField
            select
            label="Estimate Status"
            value={estimateStatus || ''}
            onChange={(e) => setEstimateStatus(e.target.value as EstimateStatus || undefined)}
            fullWidth
            sx={{ mb: 2 }}
          >
            <MenuItem value="">Not Set</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Approved">Approved</MenuItem>
            <MenuItem value="Declined">Declined</MenuItem>
            <MenuItem value="Not Required">Not Required</MenuItem>
          </TextField>
        </Box>
        
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Stepper Preview:
          </Typography>
          <RepairStatusStepper
            currentStatus={currentStatus}
            size={size}
            showLabels={showLabels}
            withTooltips={withTooltips}
            estimateStatus={estimateStatus}
          />
        </Box>
      </CardContent>
    </Card>
  );
} 