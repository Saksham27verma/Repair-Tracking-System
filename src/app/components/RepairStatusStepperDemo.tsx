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
  Switch
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
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Repair Status Stepper Demo
      </Typography>
      <Typography variant="body1" paragraph>
        This demo shows different configurations of the RepairStatusStepper component.
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Demo Controls
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={currentStatus}
                label="Status"
                onChange={(e) => setCurrentStatus(e.target.value as RepairStatus)}
              >
                <MenuItem value="Received">Received</MenuItem>
                <MenuItem value="Sent to Manufacturer">Sent to Manufacturer</MenuItem>
                <MenuItem value="Returned from Manufacturer">Returned from Manufacturer</MenuItem>
                <MenuItem value="Ready for Pickup">Ready for Pickup</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Size</InputLabel>
              <Select
                value={size}
                label="Size"
                onChange={(e) => setSize(e.target.value as 'small' | 'medium' | 'large')}
              >
                <MenuItem value="small">Small</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="large">Large</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Estimate Status</InputLabel>
              <Select
                value={estimateStatus || ""}
                label="Estimate Status"
                onChange={(e) => setEstimateStatus(e.target.value as EstimateStatus | undefined)}
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Approved">Approved</MenuItem>
                <MenuItem value="Declined">Declined</MenuItem>
                <MenuItem value="Not Required">Not Required</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={showLabels}
                  onChange={(e) => setShowLabels(e.target.checked)}
                />
              }
              label="Show Labels"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={withTooltips}
                  onChange={(e) => setWithTooltips(e.target.checked)}
                />
              }
              label="With Tooltips"
            />
          </Grid>
        </Grid>
      </Paper>

      <Typography variant="h6" gutterBottom>
        Preview
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom>
          Current Configuration:
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Status: {currentStatus} | Size: {size} | Show Labels: {showLabels ? 'Yes' : 'No'} | With Tooltips: {withTooltips ? 'Yes' : 'No'} | Estimate Status: {estimateStatus || 'None'}
        </Typography>
        
        <Box sx={{ p: 2, border: '1px dashed #ccc', borderRadius: 1 }}>
          <RepairStatusStepper
            currentStatus={currentStatus}
            size={size}
            showLabels={showLabels}
            withTooltips={withTooltips}
            estimateStatus={estimateStatus}
          />
        </Box>
      </Paper>

      <Typography variant="h6" gutterBottom>
        Usage Examples
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
              Small Size (for tight spaces)
            </Typography>
            <Box sx={{ p: 2, border: '1px dashed #ccc', borderRadius: 1 }}>
              <RepairStatusStepper
                currentStatus="Sent to Manufacturer"
                size="small"
              />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
              Declined Estimate
            </Typography>
            <Box sx={{ p: 2, border: '1px dashed #ccc', borderRadius: 1 }}>
              <RepairStatusStepper
                currentStatus="Sent to Manufacturer"
                estimateStatus="Declined"
              />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Large Size (for primary displays)
            </Typography>
            <Box sx={{ p: 2, border: '1px dashed #ccc', borderRadius: 1 }}>
              <RepairStatusStepper
                currentStatus="Completed"
                size="large"
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 