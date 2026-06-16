'use client';

import React from 'react';
import { Stepper, Step, StepLabel, Box, Tooltip, Typography, styled, useTheme, useMediaQuery } from '@mui/material';
import { RepairStatus, EstimateStatus } from '@/app/types/database';
import { requiresPatientEstimate } from '@/lib/estimate-approval';

const REPAIR_STEPS: RepairStatus[] = [
  'Received',
  'Sent to Company for Repair',
  'Returned from Manufacturer',
  'Ready for Pickup',
  'Completed'
];

const ESTIMATE_STEP = 'Estimate Approval' as const;
type FlowStep = RepairStatus | typeof ESTIMATE_STEP;

const MOBILE_STEP_LABELS: Record<FlowStep, string> = {
  'Received': 'Received',
  'Sent to Company for Repair': 'Sent',
  'Returned from Manufacturer': 'Returned',
  [ESTIMATE_STEP]: 'Estimate',
  'Ready for Pickup': 'Ready',
  'Completed': 'Completed'
};

const STEP_DESCRIPTIONS: Record<FlowStep, string> = {
  'Received': 'Your device has been received by our service center',
  'Sent to Company for Repair': 'Your device has been sent to the company for specialized repair',
  'Returned from Manufacturer': 'Your device has been returned from the manufacturer',
  [ESTIMATE_STEP]: 'Review and approve the repair estimate before we proceed',
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
  repairEstimate?: number | null;
}

function buildFlowSteps(showEstimateStep: boolean): FlowStep[] {
  if (!showEstimateStep) return [...REPAIR_STEPS];
  return [
    'Received',
    'Sent to Company for Repair',
    'Returned from Manufacturer',
    ESTIMATE_STEP,
    'Ready for Pickup',
    'Completed',
  ];
}

function getActiveStep(
  currentStatus: RepairStatus | 'Cancelled',
  estimateStatus: EstimateStatus | undefined,
  showEstimateStep: boolean
): number {
  const steps = buildFlowSteps(showEstimateStep);
  const statusIndex = REPAIR_STEPS.indexOf(currentStatus as RepairStatus);

  if (!showEstimateStep) {
    return statusIndex >= 0 ? statusIndex : 0;
  }

  if (currentStatus === 'Cancelled') return steps.length - 1;

  if (statusIndex <= 1) {
    return statusIndex;
  }

  if (statusIndex === 2) {
    if (estimateStatus === 'Pending') return 3;
    return 4;
  }

  if (statusIndex === 3) return showEstimateStep ? 4 : 3;
  if (statusIndex === 4) return showEstimateStep ? 5 : 4;

  return 0;
}

function isEstimateStepCompleted(estimateStatus?: EstimateStatus): boolean {
  return (
    estimateStatus === 'Approved' ||
    estimateStatus === 'Declined' ||
    estimateStatus === 'Not Required'
  );
}

export default function RepairStatusStepper({
  currentStatus,
  showLabels = true,
  size = 'medium',
  withTooltips = true,
  estimateStatus,
  repairEstimate,
}: RepairStatusStepperProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const showEstimateStep =
    requiresPatientEstimate({
      repair_estimate_by_company: repairEstimate,
      estimate_status: estimateStatus,
    }) && estimateStatus !== 'Not Required';

  const flowSteps = buildFlowSteps(showEstimateStep);
  const currentStep = getActiveStep(currentStatus, estimateStatus, showEstimateStep);
  const isDeclined = estimateStatus === 'Declined' || currentStatus === 'Cancelled';
  const estimatePending = estimateStatus === 'Pending' && showEstimateStep;

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
      {estimatePending && !isDeclined && (
        <Box sx={{ mb: 2, p: 2, bgcolor: '#FFF7ED', borderRadius: 1, border: '1px solid #FDBA74' }}>
          <Typography variant="subtitle2" color="warning.dark" fontWeight={700}>
            Estimate approval required
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The repair cannot proceed to pickup until the estimate is approved or declined.
          </Typography>
        </Box>
      )}

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
        {flowSteps.map((label, index) => {
          const isEstimateStep = label === ESTIMATE_STEP;
          const completed =
            isEstimateStep && isEstimateStepCompleted(estimateStatus)
              ? true
              : index < currentStep;

          return (
            <Step key={label} completed={completed}>
              {withTooltips ? (
                <Tooltip title={STEP_DESCRIPTIONS[label]} arrow>
                  <StepLabel>
                    {showLabels && (
                      <Typography 
                        variant={size === 'small' || isMobile ? 'caption' : 'body2'}
                        sx={{
                          mt: 0.5,
                          fontSize: isMobile ? '0.65rem' : undefined,
                          fontWeight: isEstimateStep && estimatePending ? 700 : undefined,
                          color: isEstimateStep && estimatePending ? 'warning.dark' : undefined,
                        }}
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
                      sx={{
                        mt: 0.5,
                        fontSize: isMobile ? '0.65rem' : undefined,
                        fontWeight: isEstimateStep && estimatePending ? 700 : undefined,
                        color: isEstimateStep && estimatePending ? 'warning.dark' : undefined,
                      }}
                    >
                      {isMobile ? MOBILE_STEP_LABELS[label] : label}
                    </Typography>
                  )}
                </StepLabel>
              )}
            </Step>
          );
        })}
      </StepperComponent>
    </Box>
  );
}
