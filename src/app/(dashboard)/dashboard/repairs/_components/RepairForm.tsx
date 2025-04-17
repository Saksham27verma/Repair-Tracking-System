'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Button,
  Paper,
  FormControlLabel,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Checkbox,
} from '@mui/material';
import { Database } from '@/app/types/supabase';
import { generateRepairId } from '@/lib/supabase';
import { useAlert } from '@/app/components/AlertProvider';
import { supabase } from '@/lib/supabase';

type RepairStatus = Database['public']['Enums']['repair_status'];
type WarrantyStatus = Database['public']['Enums']['warranty_status'];
type PaymentMode = Database['public']['Enums']['payment_mode'];
type RepairRecord = Database['public']['Tables']['repairs']['Row'];
type RepairFormData = Database['public']['Tables']['repairs']['Insert'];

interface Props {
  repair?: RepairRecord;
  mode?: 'create' | 'edit';
}

const initialFormData: Partial<RepairFormData> = {
  repair_id: '',
  status: 'Received',
  patient_name: '',
  phone: '',
  company: '',
  product_name: '',
  model_item_name: '',
  serial_no: '',
  quantity: 1,
  warranty: 'Out of Warranty',
  foc: '',
  purpose: '',
  repair_estimate_by_company: 0,
  estimate_by_us: 0,
  customer_paid: 0,
  payment_mode: 'Cash',
  programming_done: false,
  remarks: '',
  created_at: new Date().toISOString()
};

export default function RepairForm({ repair, mode = 'create' }: Props) {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [formData, setFormData] = useState<Partial<RepairFormData>>(
    repair ? { ...repair } : { ...initialFormData, repair_id: generateRepairId() }
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStatus = e.target.value as RepairStatus;
    const now = new Date().toISOString();
    
    setFormData((prev) => ({
      ...prev,
      status: newStatus,
      ...(newStatus === 'Sent to Manufacturer' && {
        date_out_to_manufacturer: now,
      }),
      ...(newStatus === 'Returned from Manufacturer' && {
        date_received_from_manufacturer: now,
      }),
      ...(newStatus === 'Completed' && {
        date_out_to_customer: now,
      }),
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate required fields
      const requiredFields = [
        'patient_name',
        'phone',
        'product_name',
        'model_item_name',
        'serial_no',
        'warranty',
        'foc',
        'purpose'
      ] as const;

      const missingFields = requiredFields.filter(
        field => !formData[field as keyof typeof formData]
      );

      if (missingFields.length > 0) {
        throw new Error(`Required fields missing: ${missingFields.join(', ')}`);
      }

      // First, create or update the customer
      const customerData = {
        name: formData.patient_name!,
        phone: formData.phone!,
        company: formData.company || null
      };

      console.log('Creating/updating customer with data:', customerData);

      // Validate phone number format
      if (!customerData.phone || customerData.phone.length < 10) {
        throw new Error('Please enter a valid phone number');
      }

      // Check if customer exists
      const { data: existingCustomer, error: searchError } = await supabase
        .from('customers')
        .select('id, name, phone')
        .eq('phone', formData.phone)
        .maybeSingle();

      if (searchError) {
        console.error('Error searching for customer:', searchError);
        throw new Error(`Error checking for existing customer: ${searchError.message}`);
      }

      let customerId;
      
      if (existingCustomer) {
        console.log('Found existing customer:', existingCustomer);
        // Update existing customer
        const { data: updatedCustomer, error: updateError } = await supabase
          .from('customers')
          .update(customerData)
          .eq('id', existingCustomer.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating customer:', updateError);
          throw new Error(`Failed to update customer: ${updateError.message}`);
        }

        if (!updatedCustomer) {
          throw new Error('Customer update returned no data');
        }

        console.log('Successfully updated customer:', updatedCustomer);
        customerId = existingCustomer.id;
      } else {
        console.log('No existing customer found, creating new customer');
        // Create new customer
        const { data: newCustomer, error: insertError } = await supabase
          .from('customers')
          .insert([{
            name: customerData.name,
            phone: customerData.phone,
            company: customerData.company
          }])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating customer:', insertError);
          throw new Error(`Failed to create customer: ${insertError.message}`);
        }

        if (!newCustomer) {
          throw new Error('Customer creation returned no data');
        }

        console.log('Successfully created new customer:', newCustomer);
        customerId = newCustomer.id;
      }

      if (!customerId) {
        throw new Error('Failed to get customer ID after create/update');
      }

      console.log('Proceeding with customer ID:', customerId);

      // Prepare repair data with proper type conversions
      const repairData = {
        ...formData,
        customer_id: customerId,
        repair_id: repair?.repair_id || generateRepairId(),
        repair_estimate_by_company: formData.repair_estimate_by_company ? Number(formData.repair_estimate_by_company) : null,
        estimate_by_us: formData.estimate_by_us ? Number(formData.estimate_by_us) : null,
        customer_paid: formData.customer_paid ? Number(formData.customer_paid) : null,
        quantity: formData.quantity ? Number(formData.quantity) : 1,
        programming_done: Boolean(formData.programming_done),
        status: formData.status || 'Received',
        created_at: new Date().toISOString()
      };

      console.log('Creating repair with data:', repairData);

      if (mode === 'create') {
        const { error: repairError } = await supabase
          .from('repairs')
          .insert([repairData])
          .select()
          .single();

        if (repairError) {
          console.error('Error creating repair:', repairError);
          throw repairError;
        }
        showAlert('Repair created successfully', 'success');
      } else {
        const { error: repairError } = await supabase
          .from('repairs')
          .update(repairData)
          .eq('id', repair?.id)
          .select()
          .single();

        if (repairError) {
          console.error('Error updating repair:', repairError);
          throw repairError;
        }
        showAlert('Repair updated successfully', 'success');
      }

      router.push('/dashboard/repairs');
      router.refresh();
    } catch (err) {
      console.error('Error in form submission:', err);
      setError(
        err instanceof Error
          ? err.message
          : `An error occurred while ${mode === 'create' ? 'creating' : 'updating'} the repair`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!repair?.id) return;

    try {
      const response = await fetch(`/api/repairs?id=${repair.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete repair record');
      }

      showAlert('Repair record deleted successfully', 'success');
      router.push('/dashboard/repairs');
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while deleting';
      setError(errorMessage);
      showAlert(errorMessage, 'error');
    }
  };

  return (
    <Paper sx={{ p: 4 }}>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={3}>
          {/* Status (Edit mode only) */}
          {mode === 'edit' && (
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleStatusChange}
              >
                <MenuItem value="Received">Received</MenuItem>
                <MenuItem value="Sent to Manufacturer">Sent to Manufacturer</MenuItem>
                <MenuItem value="Returned from Manufacturer">Returned from Manufacturer</MenuItem>
                <MenuItem value="Ready for Pickup">Ready for Pickup</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
              </TextField>
            </Grid>
          )}

          {/* Customer Information */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Patient Name"
                  name="patient_name"
                  value={formData.patient_name}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Phone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Company"
                  name="company"
                  value={formData.company || ''}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Product Information */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Product Name"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Model/Item Name"
                  name="model_item_name"
                  value={formData.model_item_name}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Serial Number"
                  name="serial_no"
                  value={formData.serial_no || ''}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Company Estimate"
                  name="repair_estimate_by_company"
                  type="number"
                  value={formData.repair_estimate_by_company || ''}
                  onChange={handleChange}
                  InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  select
                  label="Warranty Status"
                  name="warranty"
                  value={formData.warranty}
                  onChange={handleChange}
                >
                  <MenuItem value="In Warranty">In Warranty</MenuItem>
                  <MenuItem value="Out of Warranty">Out of Warranty</MenuItem>
                  <MenuItem value="Extended Warranty">Extended Warranty</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Grid>

          {/* Repair Information */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Field of Concern"
                  name="foc"
                  value={formData.foc || ''}
                  onChange={handleChange}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Purpose"
                  name="purpose"
                  value={formData.purpose || ''}
                  onChange={handleChange}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Financial Information */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Our Estimate"
                  name="estimate_by_us"
                  value={formData.estimate_by_us || ''}
                  onChange={handleChange}
                  InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Amount Paid"
                  name="customer_paid"
                  value={formData.customer_paid || ''}
                  onChange={handleChange}
                  InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Payment Mode"
                  name="payment_mode"
                  value={formData.payment_mode}
                  onChange={handleChange}
                >
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="Card">Card</MenuItem>
                  <MenuItem value="UPI">UPI</MenuItem>
                  <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Grid>

          {/* Additional Information */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.programming_done}
                      onChange={(e) => setFormData(prev => ({ ...prev, programming_done: e.target.checked }))}
                      name="programming_done"
                    />
                  }
                  label="Programming Complete"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Remarks"
                  name="remarks"
                  value={formData.remarks || ''}
                  onChange={handleChange}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </Grid>

          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              {mode === 'edit' && (
                <Button
                  type="button"
                  variant="outlined"
                  color="error"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={loading}
                >
                  Delete
                </Button>
              )}
              <Button
                type="button"
                variant="outlined"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
              >
                {mode === 'create' ? 'Create Repair' : 'Save Changes'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Repair</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this repair? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
} 