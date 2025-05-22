'use client';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Badge,
} from '@mui/material';
import { Edit as EditIcon, AttachMoney as MoneyIcon, CheckCircle as ApprovedIcon, Cancel as DeclinedIcon, HourglassEmpty as PendingIcon } from '@mui/icons-material';
import { supabase, getFreshSupabaseClient } from '@/lib/supabase';
import { type Database } from '@/app/types/supabase';
import { EstimateStatus } from '@/app/types/database';
import RefreshButton from '@/app/components/RefreshButton';
import RepairStatusStepper from '@/app/components/RepairStatusStepper';

type RepairRecord = Database['public']['Tables']['repairs']['Row'] & {
  estimate_status?: EstimateStatus;
  estimate_approval_date?: string;
};

async function getRepair(id: string) {
  // Use fresh client to avoid cache issues
  const freshClient = getFreshSupabaseClient();
  
  const { data: repair, error } = await freshClient
    .from('repairs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return null;
  }

  if (!repair) {
    return null;
  }
  
  return repair as RepairRecord;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'Received':
      return 'primary';
    case 'Sent to Manufacturer':
      return 'warning';
    case 'Returned from Manufacturer':
      return 'info';
    case 'Ready for Pickup':
      return 'secondary';
    case 'Completed':
      return 'success';
    default:
      return 'default';
  }
}

function getEstimateStatusInfo(status: EstimateStatus | undefined) {
  switch (status) {
    case 'Approved':
      return { 
        color: 'success' as const, 
        icon: <ApprovedIcon />, 
        label: 'Approved by Patient',
        iconColor: 'success' as const
      };
    case 'Declined':
      return { 
        color: 'error' as const, 
        icon: <DeclinedIcon />, 
        label: 'Declined by Patient',
        iconColor: 'error' as const
      };
    case 'Pending':
      return { 
        color: 'warning' as const, 
        icon: <PendingIcon />, 
        label: 'Pending Approval',
        iconColor: 'warning' as const
      };
    case 'Not Required':
    default:
      return { 
        color: 'default' as const, 
        icon: undefined, 
        label: 'No Approval Required',
        iconColor: 'inherit' as const
      };
  }
}

// Create a local formatDate function since we can't import the utils module
function formatDate(date: string | null | undefined) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function RepairDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const repair = await getRepair(params.id);

  if (!repair) {
    notFound();
  }

  const estimateStatus = repair.estimate_status as EstimateStatus | undefined;
  const hasEstimate = repair.repair_estimate_by_company && repair.repair_estimate_by_company > 0;
  const estimateInfo = hasEstimate ? getEstimateStatusInfo(estimateStatus) : null;

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Repair Details</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <RefreshButton variant="outlined" size="small" />
          <Button
            component={Link}
            href={`/dashboard/repairs/${repair.id}/edit`}
            variant="contained"
            startIcon={<EditIcon />}
          >
            Edit Repair
          </Button>
        </Box>
      </Box>

      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Grid container spacing={4}>
          {/* Header Information */}
          <Grid item xs={12}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Repair Status
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Chip
                  label={repair.status}
                  color={getStatusColor(repair.status)}
                  sx={{ fontSize: '1rem', py: 2, px: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Repair ID: {repair.repair_id}
                </Typography>
              </Box>
              
              {/* Add the RepairStatusStepper component */}
              <RepairStatusStepper
                currentStatus={repair.status}
                size="medium"
                withTooltips={true}
                estimateStatus={estimateStatus}
              />
            </Box>
          </Grid>

          {/* Estimate Approval Section - Show if there's an estimate */}
          {hasEstimate && estimateInfo && repair.repair_estimate_by_company && (
            <Grid item xs={12}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  borderColor: `${estimateInfo.color}.main`,
                  mb: 2
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <MoneyIcon color={estimateInfo.iconColor} />
                  <Typography variant="h6">
                    Repair Estimate: ₹{repair.repair_estimate_by_company}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    icon={estimateInfo.icon}
                    label={estimateInfo.label}
                    color={estimateInfo.color}
                    size="small"
                  />
                  {repair.estimate_approval_date && (
                    <Typography variant="body2" color="text.secondary">
                      {estimateStatus === 'Approved' ? 'Approved' : 'Responded'} on {formatDate(repair.estimate_approval_date)}
                    </Typography>
                  )}
                </Box>
                {estimateStatus === 'Pending' && (
                  <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                    Waiting for patient approval. Patient can approve or decline this estimate from their repair tracking page.
                  </Typography>
                )}
                {estimateStatus === 'Declined' && (
                  <Typography variant="body2" sx={{ mt: 1, color: 'error.main' }}>
                    Patient has declined the repair estimate. The device should be returned without repair.
                  </Typography>
                )}
              </Paper>
            </Grid>
          )}

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          {/* Customer Information */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Customer Information
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Patient Name
              </Typography>
              <Typography variant="body1">{repair.patient_name}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Phone Number
              </Typography>
              <Typography variant="body1">{repair.phone}</Typography>
            </Box>
            {repair.company && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Company
                </Typography>
                <Typography variant="body1">{repair.company}</Typography>
              </Box>
            )}
          </Grid>

          {/* Product Information */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Product Information
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Product Name
              </Typography>
              <Typography variant="body1">{repair.model_item_name}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Model/Item
              </Typography>
              <Typography variant="body1">{repair.model_item_name}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Serial Number
              </Typography>
              <Typography variant="body1">{repair.serial_no}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Warranty Status
              </Typography>
              <Typography variant="body1">{repair.warranty}</Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          {/* Repair Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Repair Information
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Field of Concern
              </Typography>
              <Typography variant="body1">{repair.purpose}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Purpose
              </Typography>
              <Typography variant="body1">{repair.purpose}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Programming Done
              </Typography>
              <Typography variant="body1">
                {repair.programming_done ? 'Yes' : 'No'}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          {/* Financial Information */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Financial Information
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Manufacturer's Estimate
              </Typography>
              <Typography variant="body1">
                {repair.repair_estimate_by_company ? `₹${repair.repair_estimate_by_company}` : '-'}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Our Estimate
              </Typography>
              <Typography variant="body1">
                {repair.estimate_by_us ? `₹${repair.estimate_by_us}` : '-'}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Amount Paid
              </Typography>
              <Typography variant="body1">
                {repair.customer_paid ? `₹${repair.customer_paid}` : '-'}
              </Typography>
            </Box>
            {repair.payment_mode && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Payment Mode
                </Typography>
                <Typography variant="body1">{repair.payment_mode}</Typography>
              </Box>
            )}
          </Grid>

          {/* Timeline */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Timeline
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Received Date
              </Typography>
              <Typography variant="body1">
                {formatDate(repair.date_of_receipt)}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Sent to Manufacturer
              </Typography>
              <Typography variant="body1">
                {formatDate(repair.date_out_to_manufacturer)}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Received from Manufacturer
              </Typography>
              <Typography variant="body1">
                {formatDate(repair.date_received_from_manufacturer)}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Completed Date
              </Typography>
              <Typography variant="body1">
                {formatDate(repair.date_out_to_customer)}
              </Typography>
            </Box>
          </Grid>

          {/* Remarks */}
          {repair.remarks && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Remarks
              </Typography>
              <Typography variant="body1">{repair.remarks}</Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Container>
  );
} 