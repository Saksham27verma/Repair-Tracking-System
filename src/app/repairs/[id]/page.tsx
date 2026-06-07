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
import { formatEarLabel, getDeviceFormatLabel, inferDeviceFormat } from '@/lib/device-format';
import EstimateApproval from '@/app/components/EstimateApproval';
import RepairStatusStepper from '@/app/components/RepairStatusStepper';
import HelpSupportButton from '@/app/components/HelpSupportButton';
import PublicRepairTracking from '@/app/components/PublicRepairTracking';
import ContentCard from '@/app/components/ui/ContentCard';
import StatusBadge from '@/app/components/ui/StatusBadge';

type RepairRecord = Database['public']['Tables']['repairs']['Row'] & {
  estimate_status?: EstimateStatus;
  estimate_approval_date?: string;
};

const REPAIR_STEPS: RepairStatus[] = [
  'Received',
  'Sent to Company for Repair',
  'Returned from Manufacturer',
  'Ready for Pickup',
  'Completed',
];

async function getRepairDetails(id: string) {
  // Use fresh client that bypasses cache
  const supabase = getFreshSupabaseClient();
  
  console.log('Fetching repair details for ID:', id);
  
  // Disable server-side caching for this function
  const { data: repair, error } = await supabase
    .from('repairs')
    .select(`
      *,
      current_center:centers!repairs_current_center_id_fkey(id, name),
      pickup_center:centers!repairs_pickup_center_id_fkey(id, name)
    `)
    .eq('repair_id', id)
    .single();

  if (error) {
    console.error('Error fetching repair details:', error);
    return null;
  }

  if (!repair) {
    console.error('No repair found with ID:', id);
    return null;
  }

  console.log('Repair found:', repair);
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
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Box
        sx={{
          mb: 4,
          p: { xs: 3, md: 4 },
          borderRadius: 3,
          background: 'linear-gradient(135deg, #EE6417 0%, #ff8545 100%)',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="overline" sx={{ opacity: 0.9, letterSpacing: 1 }}>
              Repair Tracking
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
              {repair.repair_id}
            </Typography>
            <Box sx={{ mt: 1.5 }}>
              <StatusBadge status={repair.status} />
            </Box>
          </Box>
          <RefreshButton variant="outlined" size="small" sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }} />
        </Box>
      </Box>

      <Paper elevation={0} sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>

        {/* Show estimate approval UI if there's a pending estimate */}
        {hasEstimate && estimateStatus === 'Pending' && repair.status === 'Sent to Company for Repair' && (
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
                  : estimateStatus === 'Declined' && repair.status === 'Sent to Company for Repair'
                    ? 'You declined the repair estimate. We will notify you when your device is returned from the manufacturer.'
                    : 'You declined the repair estimate. We will contact you about returning your device.'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Estimate: ₹{repair.repair_estimate_by_company}
              </Typography>
            </Box>
          </Paper>
        )}

        <RepairStatusStepper
          currentStatus={repair.status}
          size="large"
          withTooltips={true}
          estimateStatus={estimateStatus}
        />

        <Box sx={{ my: 4 }}>
          <PublicRepairTracking
            repairUuid={repair.id}
            repair={repair}
            currentLocationType={repair.current_location_type}
            currentCenterName={repair.current_center?.name}
            pickupCenterName={repair.pickup_center?.name}
            receivingCenter={repair.receiving_center}
          />
        </Box>

        <Grid container spacing={{ xs: 2, md: 3 }}>
          {/* Patient Information */}
          <Grid item xs={12} md={6}>
            <ContentCard title="Patient Information">
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
                  <Box component="a" 
                    href={`tel:${repair.phone}`}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      color: 'inherit',
                      textDecoration: 'none'
                    }}
                  >
                    <Typography variant="body1">{repair.phone}</Typography>
                    <PhoneIcon 
                      fontSize="small" 
                      sx={{ ml: 1, color: 'primary.main', display: { xs: 'inline-flex', md: 'none' } }} 
                    />
                  </Box>
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
            </ContentCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <ContentCard title="Product Information">
              <List>
                <ListItem>
                  <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                    Intake
                  </Typography>
                  <Typography variant="body1">{getDeviceFormatLabel(inferDeviceFormat(repair))}</Typography>
                </ListItem>
                <ListItem>
                  <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                    Product
                  </Typography>
                  <Typography variant="body1">{repair.model_item_name}</Typography>
                </ListItem>
                {inferDeviceFormat(repair) === 'kit' ? (
                  <>
                    <ListItem>
                      <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                        Left Serial
                      </Typography>
                      <Typography variant="body1">{repair.serial_no}</Typography>
                    </ListItem>
                    <ListItem>
                      <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                        Right Serial
                      </Typography>
                      <Typography variant="body1">{repair.serial_no_2}</Typography>
                    </ListItem>
                  </>
                ) : (
                  <ListItem>
                    <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                      Serial No.
                    </Typography>
                    <Typography variant="body1">{repair.serial_no}</Typography>
                  </ListItem>
                )}
                {repair.ear && (
                  <ListItem>
                    <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                      Ear
                    </Typography>
                    <Typography variant="body1">
                      {formatEarLabel(repair.ear, inferDeviceFormat(repair))}
                    </Typography>
                  </ListItem>
                )}
                <ListItem>
                  <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                    Warranty
                  </Typography>
                  <Typography variant="body1">{repair.warranty}</Typography>
                </ListItem>
                {repair.warranty_after_repair && (
                  <ListItem>
                    <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                      Repair Warranty
                    </Typography>
                    <Typography variant="body1">{repair.warranty_after_repair}</Typography>
                  </ListItem>
                )}
              </List>
            </ContentCard>
          </Grid>

          <Grid item xs={12}>
            <ContentCard title="Repair Details">
              <List>
                <ListItem>
                  <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                    Purpose
                  </Typography>
                  <Typography variant="body1">{repair.purpose}</Typography>
                </ListItem>
                {repair.receiving_center && (
                  <ListItem>
                    <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                      Receiving Center
                    </Typography>
                    <Typography variant="body1">{repair.receiving_center}</Typography>
                  </ListItem>
                )}
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
            </ContentCard>
          </Grid>

          {(hasEstimate || repair.customer_paid) && (
            <Grid item xs={12}>
              <ContentCard title="Financial Details">
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
              </ContentCard>
            </Grid>
          )}

          <Grid item xs={12}>
            <ContentCard title="Need Help?">
              <Typography variant="body1" paragraph>
                If you have any questions about your repair, please don't hesitate to contact us:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<PhoneIcon />}
                    href="tel:+919811168046"
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
                    href="https://wa.me/919811168046"
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
                    href="mailto:hearinghope@gmail.com"
                    sx={{ py: 1.5 }}
                  >
                    Email Us
                  </Button>
                </Grid>
              </Grid>
            </ContentCard>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Help and Support Button */}
      <HelpSupportButton />
    </Container>
  );
} 