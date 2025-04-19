'use client';

import React from 'react';
import { Stepper, Step, StepLabel, Box, Tooltip, Typography, styled } from '@mui/material';
import { RepairStatus, EstimateStatus } from '@/app/types/database';

// Define the steps for the repair process
const REPAIR_STEPS: RepairStatus[] = [
  'Received',
  'Sent to Manufacturer',
  'Returned from Manufacturer',
  'Ready for Pickup',
  'Completed',
];

// Optional descriptions for each step to display in tooltips
const STEP_DESCRIPTIONS = {
  'Received': 'Your device has been received by our service center',
  'Sent to Manufacturer': 'Your device has been sent to the manufacturer for repair',
  'Returned from Manufacturer': 'Your device has been returned from the manufacturer',
  'Ready for Pickup': 'Your device is repaired and ready for pickup',
  'Completed': 'The repair process is complete and your device has been returned',
  'Cancelled': 'Your repair request has been cancelled',
};

// Create a styled version of Stepper for declined repairs
const DeclinedStepper = styled(Stepper)(({ theme }) => ({
  opacity: 0.5,
  '& .MuiStepIcon-root': {
    color: theme.palette.grey[400],
  },
  '& .MuiStepLabel-label': {
    color: theme.palette.text.disabled,
  }
}));

interface RepairStatusStepperProps {
  currentStatus: RepairStatus | 'Cancelled';
  showLabels?: boolean;
  size?: 'small' | 'medium' | 'large';
  withTooltips?: boolean;
  estimateStatus?: EstimateStatus;
}

export default function RepairStatusStepper({
  currentStatus,
  showLabels = true,
  size = 'medium',
  withTooltips = true,
  estimateStatus
}: RepairStatusStepperProps) {
  // Find the index of the current status in the steps array
  const currentStep = REPAIR_STEPS.indexOf(currentStatus as RepairStatus);
  
  // Determine if the repair was cancelled (declined estimate)
  const isDeclined = estimateStatus === 'Declined' || currentStatus === 'Cancelled';
  
  // Determine styling based on size prop
  const getSizing = () => {
    switch(size) {
      case 'small':
        return { py: 0.5, mb: 2 };
      case 'large':
        return { py: 2, mb: 6 };
      case 'medium':
      default:
        return { py: 1, mb: 4 };
    }
  };

  // Choose the appropriate stepper based on the repair status
  const StepperComponent = isDeclined ? DeclinedStepper : Stepper;

  return (
    <Box sx={{ ...getSizing() }}>
      {isDeclined && (
        <Box sx={{ mb: 2, p: 2, bgcolor: '#ffebee', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="error">
            Repair Cancelled
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {currentStatus === 'Sent to Manufacturer' 
              ? "We'll notify you when your device is returned from the manufacturer." 
              : "Your repair request has been cancelled."}
          </Typography>
        </Box>
      )}
      
      <StepperComponent 
        activeStep={currentStep}
        alternativeLabel={showLabels}
      >
        {REPAIR_STEPS.map((label) => (
          <Step key={label}>
            {withTooltips ? (
              <Tooltip title={STEP_DESCRIPTIONS[label]} arrow>
                <StepLabel>
                  {showLabels && (
                    <Typography 
                      variant={size === 'small' ? 'caption' : 'body2'}
                      sx={{ mt: 0.5 }}
                    >
                      {label}
                    </Typography>
                  )}
                </StepLabel>
              </Tooltip>
            ) : (
              <StepLabel>
                {showLabels && (
                  <Typography 
                    variant={size === 'small' ? 'caption' : 'body2'}
                    sx={{ mt: 0.5 }}
                  >
                    {label}
                  </Typography>
                )}
              </StepLabel>
            )}
          </Step>
        ))}
      </StepperComponent>
    </Box>
  );
} 