'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  TextField,
  Stack,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from '@mui/material';
import { Database } from '@/app/types/supabase';
import { supabase } from '@/lib/supabase';
import { useAlert } from '@/app/components/AlertProvider';

type CustomerInsert = Database['public']['Tables']['customers']['Insert'];

interface CustomerFormProps {
  customer?: Database['public']['Tables']['customers']['Row'];
  mode?: 'create' | 'edit';
}

export default function CustomerForm({ customer, mode = 'create' }: CustomerFormProps) {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [formData, setFormData] = useState<CustomerInsert>({
    name: customer?.name || '',
    phone: customer?.phone || '',
    company: customer?.company || null,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'company' ? (value || null) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.phone) {
        throw new Error('Name and phone number are required');
      }

      const dataToSubmit: CustomerInsert = {
        name: formData.name,
        phone: formData.phone,
        company: formData.company || null,
      };

      if (mode === 'create') {
        const { error: supabaseError } = await supabase
          .from('customers')
          .insert([dataToSubmit]);

        if (supabaseError) throw supabaseError;

        showAlert('Customer created successfully', 'success');
      } else {
        const { error: supabaseError } = await supabase
          .from('customers')
          .update(dataToSubmit)
          .eq('id', customer?.id);

        if (supabaseError) throw supabaseError;

        showAlert('Customer updated successfully', 'success');
      }

      router.push('/dashboard/customers');
      router.refresh();
    } catch (err) {
      console.error('Error:', err);
      setError(
        err instanceof Error
          ? err.message
          : `An error occurred while ${mode === 'create' ? 'creating' : 'updating'} the customer`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!customer?.id) return;

    setLoading(true);
    setError(null);

    try {
      const { error: supabaseError } = await supabase
        .from('customers')
        .delete()
        .eq('id', customer.id);

      if (supabaseError) throw supabaseError;

      showAlert('Customer deleted successfully', 'success');
      router.push('/dashboard/customers');
      router.refresh();
    } catch (err) {
      console.error('Error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while deleting the customer'
      );
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={3} maxWidth="sm">
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <TextField
          required
          fullWidth
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={!formData.name}
          helperText={!formData.name && 'Name is required'}
        />
        
        <TextField
          required
          fullWidth
          label="Phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          error={!formData.phone}
          helperText={!formData.phone && 'Phone number is required'}
        />
        
        <TextField
          fullWidth
          label="Company"
          name="company"
          value={formData.company || ''}
          onChange={handleChange}
        />

        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            fullWidth
          >
            {loading
              ? mode === 'create'
                ? 'Creating...'
                : 'Saving...'
              : mode === 'create'
              ? 'Create Customer'
              : 'Save Changes'}
          </Button>

          {mode === 'edit' && (
            <Button
              variant="outlined"
              color="error"
              disabled={loading}
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete
            </Button>
          )}
        </Box>
      </Stack>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Customer</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this customer? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 