import { notFound } from 'next/navigation';
import {
  Container,
  Paper,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
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
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
} from '@mui/icons-material';
import { supabase } from '@/lib/supabase';
import { RepairStatus } from '@/app/types/database';
import { Database } from '@/app/types/supabase';

type RepairRecord = Database['public']['Tables']['repairs']['Row'];

const REPAIR_STEPS: RepairStatus[] = [
  'Received',
  'Sent to Manufacturer',
  'Returned from Manufacturer',
  'Ready for Pickup',
  'Completed',
];

async function getRepairDetails(id: string) {
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

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom>
          Repair Status
        </Typography>

        <Box sx={{ mb: 6 }}>
          <Stepper activeStep={currentStep} alternativeLabel>
            {REPAIR_STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Grid container spacing={4}>
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