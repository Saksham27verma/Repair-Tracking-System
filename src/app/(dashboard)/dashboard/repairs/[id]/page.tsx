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
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { supabase } from '@/lib/supabase';
import { type Database } from '@/app/types/supabase';

type RepairRecord = Database['public']['Tables']['repairs']['Row'];

async function getRepair(id: string) {
  const { data: repair, error } = await supabase
    .from('repairs')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !repair) {
    return null;
  }

  return repair;
}

function formatDate(date: string | null) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
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

export default async function RepairDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const repair = await getRepair(params.id);

  if (!repair) {
    notFound();
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Repair Details</Typography>
        <Button
          component={Link}
          href={`/dashboard/repairs/${repair.id}/edit`}
          variant="contained"
          startIcon={<EditIcon />}
        >
          Edit Repair
        </Button>
      </Box>

      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Grid container spacing={4}>
          {/* Header Information */}
          <Grid item xs={12}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Status
              </Typography>
              <Chip
                label={repair.status}
                color={getStatusColor(repair.status)}
                sx={{ fontSize: '1rem', py: 2, px: 1 }}
              />
            </Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Repair ID
              </Typography>
              <Typography variant="h6">{repair.repair_id}</Typography>
            </Box>
          </Grid>

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
              <Typography variant="body1">{repair.product_name}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Model/Item Name
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
              <Typography variant="body1">{repair.foc}</Typography>
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
                Repair Estimate by Company
              </Typography>
              <Typography variant="body1">
                {repair.repair_estimate_by_company
                  ? `₹${repair.repair_estimate_by_company}`
                  : '-'}
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
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Payment Mode
              </Typography>
              <Typography variant="body1">
                {repair.payment_mode || '-'}
              </Typography>
            </Box>
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