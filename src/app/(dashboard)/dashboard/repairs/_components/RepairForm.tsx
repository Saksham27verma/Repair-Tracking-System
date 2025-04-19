'use client';

import React, { useState, useEffect } from 'react';
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
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  Snackbar,
  CircularProgress,
  InputAdornment,
  Autocomplete,
} from '@mui/material';
// Comment out problematic import and use direct imports from database.ts
// import { Database } from '@/app/types/supabase';
import { generateRepairId, supabase } from '@/lib/supabase';
import { useAlert } from '@/app/components/AlertProvider';
import { 
  EstimateStatus, 
  MouldType, 
  Ear, 
  RepairStatus, 
  WarrantyStatus,
  PaymentMode,
  CompanyType,
  HEARING_AID_MODELS,
  RepairRecord
} from '@/app/types/database';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { styled } from '@mui/material/styles';
import { nanoid } from 'nanoid';
import { createSlug } from '@/lib/utils';

dayjs.extend(utc);

const CustomTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: theme.palette.primary.main,
    },
    '&:hover fieldset': {
      borderColor: theme.palette.primary.dark,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
    },
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    '&:hover fieldset': {
      borderColor: theme.palette.primary.dark,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
    },
  },
}));

type EarType = Ear | null;

interface FormState {
  repair_id: string;
  status: RepairStatus;
  patient_name: string;
  phone: string;
  company: CompanyType | '';
  model_item_name: string;
  serial_no: string;
  quantity: number;
  warranty: WarrantyStatus;
  purpose: string;
  repair_estimate: number | null;
  customer_paid: number | null;
  payment_mode: PaymentMode | null;
  programming_done: boolean;
  remarks: string;
  estimate_status: EstimateStatus;
  date_of_receipt?: string;
  date_out_to_manufacturer?: string | null;
  date_received_from_manufacturer?: string | null;
  date_out_to_customer?: string | null;
  created_at?: string;
  updated_at?: string;
  ear: EarType;
  mould: MouldType | '';
}

interface Props {
  repair?: RepairRecord;
  mode?: 'create' | 'edit';
}

const initialFormData: FormState = {
  repair_id: '',
  status: 'Received',
  patient_name: '',
  phone: '',
  company: '',
  model_item_name: '',
  serial_no: '',
  quantity: 1,
  warranty: 'Out of warranty',
  purpose: '',
  repair_estimate: null,
  customer_paid: null,
  payment_mode: null,
  programming_done: false,
  remarks: '',
  estimate_status: 'Not Required',
  ear: null,
  mould: '',
};

export default function RepairForm({ repair, mode = 'create' }: Props) {
  const router = useRouter();
  const { showAlert } = useAlert();
  
  // Initialize form state with proper types
  const [formData, setFormData] = useState<FormState>(() => {
    if (repair) {
      return {
        // Initialize with default values first
        ...initialFormData,
        // Then override with repair data
        repair_id: repair.repair_id,
        status: repair.status,
        patient_name: repair.patient_name,
        phone: repair.phone,
        company: repair.company || '',
        model_item_name: repair.model_item_name,
        serial_no: repair.serial_no,
        quantity: repair.quantity,
        warranty: repair.warranty,
        purpose: repair.purpose,
        // Use repair_estimate_by_company as the primary estimate, fallback to estimate_by_us if needed
        repair_estimate: repair.repair_estimate_by_company || repair.estimate_by_us,
        customer_paid: repair.customer_paid,
        payment_mode: repair.payment_mode,
        programming_done: repair.programming_done,
        remarks: repair.remarks || '',
        estimate_status: (repair.estimate_status as EstimateStatus) || 'Not Required',
        date_of_receipt: repair.date_of_receipt,
        date_out_to_manufacturer: repair.date_out_to_manufacturer,
        date_received_from_manufacturer: repair.date_received_from_manufacturer,
        date_out_to_customer: repair.date_out_to_customer,
        created_at: repair.created_at,
        updated_at: repair.updated_at,
        ear: repair.ear ? repair.ear.toLowerCase() as EarType : null,
        mould: repair.mould || '',
      };
    } else {
      // New repair - use defaults + generate ID
      return { 
        ...initialFormData, 
        repair_id: generateRepairId() 
      };
    }
  });
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

  const handleEstimateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const estimateValue = e.target.value ? Number(e.target.value) : 0;
    
    setFormData((prev) => ({
      ...prev,
      repair_estimate: estimateValue || null,
      estimate_status: estimateValue > 0 && (!prev.estimate_status || prev.estimate_status === 'Not Required')
        ? 'Pending'
        : prev.estimate_status || 'Not Required'
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
        'model_item_name',
        'serial_no',
        'warranty',
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
        name: formData.patient_name,
        phone: formData.phone,
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

        customerId = existingCustomer.id;
      } else {
        console.log('No existing customer found, creating new customer');
        // Create new customer
        const { data: newCustomer, error: insertError } = await supabase
          .from('customers')
          .insert([customerData])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating customer:', insertError);
          throw new Error(`Failed to create customer: ${insertError.message}`);
        }

        if (!newCustomer) {
          throw new Error('Customer creation returned no data');
        }

        customerId = newCustomer.id;
      }

      if (!customerId) {
        throw new Error('Failed to get customer ID after create/update');
      }

      console.log('Proceeding with customer ID:', customerId);

      // Ensure date fields are in proper format
      const now = new Date().toISOString();
      const dateOfReceipt = formData.date_of_receipt || now;

      // Prepare database object
      const dbData = {
        customer_id: customerId,
        patient_name: formData.patient_name,
        phone: formData.phone,
        company: formData.company || null,
        model_item_name: formData.model_item_name,
        serial_no: formData.serial_no,
        quantity: Number(formData.quantity) || 1,
        warranty: formData.warranty,
        purpose: formData.purpose,
        repair_estimate_by_company: formData.repair_estimate, // Store our single estimate in the repair_estimate_by_company field
        estimate_by_us: null, // We're not using this field anymore
        customer_paid: formData.customer_paid,
        payment_mode: formData.payment_mode || null,
        programming_done: Boolean(formData.programming_done),
        remarks: formData.remarks || null,
        estimate_status: formData.estimate_status,
        updated_at: now,
        ear: formData.ear,
        mould: formData.mould || null
      };

      if (mode === 'create') {
        // Add fields specific to creation
        const createData = {
          ...dbData,
          repair_id: formData.repair_id,
          status: 'Received', // Always start with Received
          date_of_receipt: dateOfReceipt,
          created_at: now
        };
        
        console.log('Creating repair with data:', createData);

        const { error: repairError } = await supabase
          .from('repairs')
          .insert([createData]);

        if (repairError) {
          console.error('Error creating repair:', repairError);
          // Show more detailed error information
          console.log('Error details:', repairError.details, repairError.hint, repairError.code);
          throw new Error(`Failed to create repair: ${repairError.message}${repairError.details ? ` (${repairError.details})` : ''}`);
        }
        
        showAlert('Repair created successfully', 'success');
      } else {
        // Add fields specific to updates
        const updateData = {
          ...dbData,
          status: formData.status,
          date_out_to_manufacturer: formData.date_out_to_manufacturer,
          date_received_from_manufacturer: formData.date_received_from_manufacturer,
          date_out_to_customer: formData.date_out_to_customer
        };
        
        console.log('Updating repair with data:', updateData);

        const { error: repairError } = await supabase
          .from('repairs')
          .update(updateData)
          .eq('id', repair?.id);

        if (repairError) {
          console.error('Error updating repair:', repairError);
          throw new Error(`Failed to update repair: ${repairError.message}`);
        }
        
        if (repair?.repair_id) {
          try {
            await fetch(`/api/cache-invalidate?repair_id=${repair.repair_id}`, {
              method: 'POST',
              cache: 'no-store',
            });
          } catch (cacheError) {
            console.error('Failed to invalidate cache, but repair was updated:', cacheError);
          }
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
                  select
                  label="Company"
                  name="company"
                  value={formData.company || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value as CompanyType | '' }))}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="Signia">Signia</MenuItem>
                  <MenuItem value="Phonak">Phonak</MenuItem>
                  <MenuItem value="Widex">Widex</MenuItem>
                  <MenuItem value="Starkey">Starkey</MenuItem>
                  <MenuItem value="GNResound">GNResound</MenuItem>
                  <MenuItem value="Unitron">Unitron</MenuItem>
                  <MenuItem value="Oticon">Oticon</MenuItem>
                  <MenuItem value="Siemens">Siemens</MenuItem>
                  <MenuItem value="Others">Others</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Grid>

          {/* Product Information */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  freeSolo
                  options={HEARING_AID_MODELS}
                  value={formData.model_item_name}
                  onChange={(event, newValue) => {
                    setFormData(prev => ({
                      ...prev,
                      model_item_name: newValue || '',
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      fullWidth
                      label="Model/Item Name"
                      name="model_item_name"
                      onChange={(e) => {
                        // Handle direct typing in the input
                        setFormData(prev => ({
                          ...prev,
                          model_item_name: e.target.value,
                        }));
                      }}
                    />
                  )}
                  groupBy={(option) => {
                    // Group by manufacturer
                    if (option.startsWith('Signia')) return 'Signia';
                    if (option.startsWith('Phonak')) return 'Phonak';
                    if (option.startsWith('Widex')) return 'Widex';
                    if (option.startsWith('Starkey')) return 'Starkey';
                    if (option.startsWith('ReSound')) return 'ReSound';
                    if (option.startsWith('Unitron')) return 'Unitron';
                    if (option.startsWith('Oticon')) return 'Oticon';
                    if (option.startsWith('Siemens')) return 'Siemens';
                    return 'Models';
                  }}
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
                  fullWidth
                  type="number"
                  label="Repair Estimate"
                  name="repair_estimate"
                  value={formData.repair_estimate || ''}
                  onChange={handleEstimateChange}
                  InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                  helperText={formData.repair_estimate && formData.repair_estimate > 0 ? 
                    "Patient will need to approve this estimate" : ""}
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
                  <MenuItem value="2 years warranty">2 years warranty</MenuItem>
                  <MenuItem value="3 years warranty">3 years warranty</MenuItem>
                  <MenuItem value="4 years warranty">4 years warranty</MenuItem>
                  <MenuItem value="Out of warranty">Out of warranty</MenuItem>
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
                  value={formData.payment_mode || ''}
                  onChange={handleChange}
                >
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="Card">Card</MenuItem>
                  <MenuItem value="UPI">UPI</MenuItem>
                  <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                </TextField>
              </Grid>
              {formData.repair_estimate && formData.repair_estimate > 0 && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Estimate Status"
                    name="estimate_status"
                    value={formData.estimate_status || 'Pending'}
                    onChange={handleChange}
                  >
                    <MenuItem value="Pending">Pending Approval</MenuItem>
                    <MenuItem value="Approved">Approved</MenuItem>
                    <MenuItem value="Declined">Declined</MenuItem>
                    <MenuItem value="Not Required">Not Required</MenuItem>
                  </TextField>
                </Grid>
              )}
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

          {/* New fields for ear and mould */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <FormLabel id="ear-label">Ear</FormLabel>
              <RadioGroup
                aria-labelledby="ear-label"
                name="ear"
                value={formData.ear || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, ear: e.target.value as EarType }))}
                row
              >
                <FormControlLabel value="left" control={<Radio />} label="Left" />
                <FormControlLabel value="right" control={<Radio />} label="Right" />
                <FormControlLabel value="both" control={<Radio />} label="Both" />
              </RadioGroup>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              id="mould"
              label="Mould"
              name="mould"
              value={formData.mould || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, mould: e.target.value as MouldType | '' }))}
            >
              <MenuItem value="">None</MenuItem>
              <MenuItem value="Soft Half Concha Mould">Soft Half Concha Mould</MenuItem>
              <MenuItem value="Soft Full Concha Mould">Soft Full Concha Mould</MenuItem>
              <MenuItem value="Hard Half Concha Mould">Hard Half Concha Mould</MenuItem>
              <MenuItem value="Hard Full Concha Mould">Hard Full Concha Mould</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>
          </Grid>

          {error && (
            <Grid item xs={12}>
              <Alert 
                severity="error" 
                variant="filled" 
                sx={{ 
                  mb: 3, 
                  '& .MuiAlert-message': { 
                    fontWeight: 'medium',
                  } 
                }}
              >
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Error creating repair:
                </Typography>
                <Typography variant="body2">
                  {error}
                </Typography>
                {error.includes('duplicate key') && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    It appears this record already exists or there's a conflict with an existing entry.
                    Try using a different phone number or check if the customer already exists.
                  </Typography>
                )}
              </Alert>
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