'use client';

import React from 'react';
import { Stepper, Step, StepLabel, Box, Tooltip, Typography, styled, useTheme, useMediaQuery } from '@mui/material';
import { RepairStatus, EstimateStatus } from '@/app/types/database';

const REPAIR_STEPS: RepairStatus[] = [
  'Received',
  'Sent to Company for Repair',
  'Returned from Manufacturer',
  'Ready for Pickup',
  'Completed'
];

const MOBILE_STEP_LABELS: Record<RepairStatus, string> = {
  'Received': 'Received',
  'Sent to Company for Repair': 'Sent',
  'Returned from Manufacturer': 'Returned',
  'Ready for Pickup': 'Ready',
  'Completed': 'Completed'
};

const STEP_DESCRIPTIONS: Record<RepairStatus, string> = {
  'Received': 'Your device has been received by our service center',
  'Sent to Company for Repair': 'Your device has been sent to the company for specialized repair',
  'Returned from Manufacturer': 'Your device has been returned from the manufacturer',
  'Ready for Pickup': 'Your device is repaired and ready for pickup',
  'Completed': 'The repair process is complete and your device has been returned'
};

const DeclinedStepper = styled(Stepper)(({ theme }) => ({
  opacity: 0.5,
  '& .MuiStepIcon-root': {
    color: theme.palette.grey[400],
  },
  '& .MuiStepLabel-label': {
    color: theme.palette.text.disabled,
  }
}));

const ResponsiveStepper = styled(Stepper)(({ theme }) => ({
  [theme.breakpoints.down('sm')]: {
    '& .MuiStepLabel-iconContainer': {
      paddingRight: theme.spacing(0.5),
    },
    '& .MuiStepLabel-labelContainer': {
      width: '100%',
    },
    '& .MuiStep-root': {
      padding: '0 4px',
    },
  },
}));

const ResponsiveDeclinedStepper = styled(DeclinedStepper)(({ theme }) => ({
  [theme.breakpoints.down('sm')]: {
    '& .MuiStepLabel-iconContainer': {
      paddingRight: theme.spacing(0.5),
    },
    '& .MuiStepLabel-labelContainer': {
      width: '100%',
    },
    '& .MuiStep-root': {
      padding: '0 4px',
    },
  },
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const currentStep = REPAIR_STEPS.indexOf(currentStatus as RepairStatus);
  const isDeclined = estimateStatus === 'Declined' || currentStatus === 'Cancelled';

  const getSizing = () => {
    switch(size) {
      case 'small':
        return { py: 0.5, mb: 2 };
      case 'large':
        return isMobile ? { py: 1, mb: 3 } : { py: 2, mb: 6 };
      case 'medium':
      default:
        return isMobile ? { py: 0.5, mb: 2 } : { py: 1, mb: 4 };
    }
  };

  const StepperComponent = isDeclined 
    ? (isMobile ? ResponsiveDeclinedStepper : DeclinedStepper)
    : (isMobile ? ResponsiveStepper : Stepper);

  return (
    <Box sx={{ ...getSizing(), overflow: 'auto' }}>
      {isDeclined && (
        <Box sx={{ mb: 2, p: 2, bgcolor: '#ffebee', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="error">
            Repair Cancelled
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {currentStatus === 'Sent to Company for Repair' 
              ? "We'll notify you when your device is returned from the manufacturer." 
              : "Your repair request has been cancelled."}
          </Typography>
        </Box>
      )}
      
      {currentStatus === 'Ready for Pickup' && !isDeclined && (
        <Box sx={{ mb: 2, p: 2, bgcolor: '#e8f5e9', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="success.main">
            Your device is ready for pickup
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please pick up your device within 1 month. The company will not be liable for any losses after this period.
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
                      variant={size === 'small' || isMobile ? 'caption' : 'body2'}
                      sx={{ mt: 0.5, fontSize: isMobile ? '0.65rem' : undefined }}
                    >
                      {isMobile ? MOBILE_STEP_LABELS[label] : label}
                    </Typography>
                  )}
                </StepLabel>
              </Tooltip>
            ) : (
              <StepLabel>
                {showLabels && (
                  <Typography 
                    variant={size === 'small' || isMobile ? 'caption' : 'body2'}
                    sx={{ mt: 0.5, fontSize: isMobile ? '0.65rem' : undefined }}
                  >
                    {isMobile ? MOBILE_STEP_LABELS[label] : label}
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
