'use client';

import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';

interface FormData {
  name: string;
  phone: string;
}

export default function RepairTrackingForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/repairs/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to verify repair status');
      }

      // Handle successful verification and redirect to status page
      const data = await response.json();
      window.location.href = `/repairs/${data.repairId}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography variant="h6" gutterBottom>
        Track your repair status
      </Typography>

      <TextField
        margin="normal"
        required
        fullWidth
        id="name"
        label="Patient Name"
        name="name"
        autoComplete="name"
        value={formData.name}
        onChange={handleChange}
        error={!formData.name}
        helperText={!formData.name && 'Name is required'}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        id="phone"
        label="Phone Number"
        name="phone"
        autoComplete="tel"
        value={formData.phone}
        onChange={handleChange}
        error={!formData.phone}
        helperText={!formData.phone && 'Phone number is required'}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Button
        type="submit"
        fullWidth
        variant="contained"
        disabled={loading || !formData.name || !formData.phone}
        sx={{ mt: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : 'Track Repair'}
      </Button>
    </Box>
  );
} 