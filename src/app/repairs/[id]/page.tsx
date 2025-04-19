import { notFound } from 'next/navigation';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { getFreshSupabaseClient } from '@/lib/supabase';
import { RepairStatus, EstimateStatus } from '@/app/types/database';
import { Database } from '@/app/types/supabase';
import RefreshButton from '@/app/components/RefreshButton';
import EstimateApproval from '@/app/components/EstimateApproval';
import RepairStatusStepper from '@/app/components/RepairStatusStepper';

type RepairRecord = Database['public']['Tables']['repairs']['Row'] & {
  estimate_status?: EstimateStatus;
  estimate_approval_date?: string;
};

const REPAIR_STEPS: RepairStatus[] = [
  'Received',
  'Sent to Manufacturer',
  'Returned from Manufacturer',
  'Ready for Pickup',
  'Completed',
];

async function getRepairDetails(id: string) {
  // Use fresh client that bypasses cache
  const supabase = getFreshSupabaseClient();
  
  // Disable server-side caching for this function
  const { data: repair, error } = await supabase
    .from('repairs')
    .select('*')
    .eq('repair_id', id)
    .single();

  if (error || !repair) {
    return null;
  }

  return repair as RepairRecord;
}

// Disable page caching to ensure fresh data on each request
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RepairStatusPage({
  params,
}: {
  params: { id: string };
}) {
  const repair = await getRepairDetails(params.id);

  if (!repair) {
    notFound();
  }

  const currentStep = REPAIR_STEPS.indexOf(repair.status);
  const estimateStatus = repair.estimate_status || 'Not Required';
  const hasEstimate = repair.repair_estimate_by_company && repair.repair_estimate_by_company > 0;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 2 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          mb: 3,
          gap: { xs: 2, sm: 0 },
        }}>
          <Typography variant="h5" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
            Repair Status
          </Typography>
          <RefreshButton variant="outlined" size="small" />
        </Box>

        {/* Show estimate approval UI if there's a pending estimate */}
        {hasEstimate && estimateStatus === 'Pending' && repair.status === 'Sent to Manufacturer' && (
          <EstimateApproval 
            repairId={repair.repair_id} 
            estimate={repair.repair_estimate_by_company || 0} 
            status={estimateStatus}
          />
        )}

        {/* Show estimate status if it's been responded to */}
        {hasEstimate && (estimateStatus === 'Approved' || estimateStatus === 'Declined') && (
          <Paper 
            elevation={1} 
            sx={{ 
              p: 2, 
              mb: 4, 
              backgroundColor: estimateStatus === 'Approved' ? '#e8f5e9' : '#ffebee',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <MoneyIcon color={estimateStatus === 'Approved' ? 'success' : 'error'} />
            <Box>
              <Typography variant="body1" fontWeight="medium">
                {estimateStatus === 'Approved' 
                  ? 'You approved the repair estimate.' 
                  : estimateStatus === 'Declined' && repair.status === 'Sent to Manufacturer'
                    ? 'You declined the repair estimate. We will notify you when your device is returned from the manufacturer.'
                    : 'You declined the repair estimate. Your repair request has been cancelled.'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Estimate: ₹{repair.repair_estimate_by_company}
              </Typography>
            </Box>
          </Paper>
        )}

        {/* Using the new RepairStatusStepper component */}
        <RepairStatusStepper
          currentStatus={repair.status}
          size="large"
          withTooltips={true}
          estimateStatus={estimateStatus}
        />

        <Grid container spacing={{ xs: 2, md: 4 }}>
          {/* Patient Information */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom color="primary">
                Patient Information
              </Typography>
              <List>
                <ListItem>
                  <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                    Name
                  </Typography>
                  <Typography variant="body1">{repair.patient_name}</Typography>
                </ListItem>
                <ListItem>
                  <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                    Phone
                  </Typography>
                  <Typography variant="body1">{repair.phone}</Typography>
                </ListItem>
                {repair.company && (
                  <ListItem>
                    <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                      Company
                    </Typography>
                    <Typography variant="body1">{repair.company}</Typography>
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>

          {/* Product Information */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom color="primary">
                Product Information
              </Typography>
              <List>
                <ListItem>
                  <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                    Product
                  </Typography>
                  <Typography variant="body1">{repair.product_name}</Typography>
                </ListItem>
                <ListItem>
                  <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                    Model
                  </Typography>
                  <Typography variant="body1">{repair.model_item_name}</Typography>
                </ListItem>
                <ListItem>
                  <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                    Serial No.
                  </Typography>
                  <Typography variant="body1">{repair.serial_no}</Typography>
                </ListItem>
                <ListItem>
                  <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                    Warranty
                  </Typography>
                  <Typography variant="body1">{repair.warranty}</Typography>
                </ListItem>
              </List>
            </Paper>
          </Grid>

          {/* Repair Details */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Repair Details
              </Typography>
              <List>
                <ListItem>
                  <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                    Issue
                  </Typography>
                  <Typography variant="body1">{repair.foc}</Typography>
                </ListItem>
                <ListItem>
                  <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                    Purpose
                  </Typography>
                  <Typography variant="body1">{repair.purpose}</Typography>
                </ListItem>
                <ListItem>
                  <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                    Received Date
                  </Typography>
                  <Typography variant="body1">
                    {new Date(repair.date_of_receipt).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Typography>
                </ListItem>
              </List>
            </Paper>
          </Grid>

          {/* Financial Information - Only show if there's a cost */}
          {(hasEstimate || repair.customer_paid) && (
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Financial Details
                </Typography>
                <List>
                  {hasEstimate && (
                    <ListItem>
                      <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                        Repair Estimate
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">
                          ₹{repair.repair_estimate_by_company}
                        </Typography>
                        {estimateStatus !== 'Not Required' && (
                          <Chip 
                            label={estimateStatus} 
                            size="small"
                            color={
                              estimateStatus === 'Approved' ? 'success' :
                              estimateStatus === 'Declined' ? 'error' :
                              'warning'
                            }
                          />
                        )}
                      </Box>
                    </ListItem>
                  )}
                  {repair.customer_paid && repair.customer_paid > 0 && (
                    <ListItem>
                      <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                        Amount Paid
                      </Typography>
                      <Typography variant="body1">
                        ₹{repair.customer_paid}
                      </Typography>
                    </ListItem>
                  )}
                </List>
              </Paper>
            </Grid>
          )}

          {/* Contact Section */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Need Help?
              </Typography>
              <Typography variant="body1" paragraph>
                If you have any questions about your repair, please don't hesitate to contact us:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<PhoneIcon />}
                    href="tel:+911234567890"
                    sx={{ py: 1.5 }}
                  >
                    Call Us
                  </Button>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<WhatsAppIcon />}
                    href="https://wa.me/911234567890"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ py: 1.5 }}
                  >
                    WhatsApp
                  </Button>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<EmailIcon />}
                    href="mailto:support@example.com"
                    sx={{ py: 1.5 }}
                  >
                    Email Us
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
} 