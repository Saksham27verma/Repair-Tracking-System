'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';

interface FormData {
  phone: string;
  captcha: string;
}

export default function RepairTrackingForm() {
  const [formData, setFormData] = useState<FormData>({
    phone: '',
    captcha: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaText, setCaptchaText] = useState('');

  // Generate a random captcha text
  const generateCaptcha = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.captcha.toUpperCase() !== captchaText) {
      setError('Invalid captcha code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/repairs/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: formData.phone }),
      });

      // Check if the response is OK before trying to parse JSON
      if (!response.ok) {
        let errorMessage = 'Failed to verify repair status';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          console.error('Error parsing error response:', jsonError);
        }
        throw new Error(errorMessage);
      }

      // Parse the successful response
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Error parsing successful response:', jsonError);
        throw new Error('Invalid response format from server');
      }

      if (!data || !data.repairId) {
        throw new Error('Invalid response data from server');
      }

      // If we got here, we have a valid repairId
      console.log('Successfully verified repair:', data.repairId);
      
      // Instead of using session storage, add a URL parameter
      window.location.href = `/repairs/${data.repairId}?showNotification=true`;
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
        id="phone"
        label="Phone Number"
        name="phone"
        autoComplete="tel"
        value={formData.phone}
        onChange={handleChange}
        error={!formData.phone}
        helperText={!formData.phone && 'Phone number is required'}
        inputProps={{
          pattern: '[0-9]*',
          maxLength: 10,
        }}
      />

      <Box sx={{ 
        mt: 2, 
        p: 2, 
        bgcolor: '#f8fafc',
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 2 
      }}>
        <Typography
          sx={{
            fontFamily: 'monospace',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            letterSpacing: '0.25em',
            color: '#475569',
            userSelect: 'none',
            bgcolor: '#fff',
            p: 1,
            borderRadius: 1,
            border: '1px dashed #cbd5e1'
          }}
        >
          {captchaText}
        </Typography>
        <Button
          size="small"
          onClick={generateCaptcha}
          sx={{ 
            minWidth: 'auto',
            color: '#64748b',
            '&:hover': {
              bgcolor: '#e2e8f0'
            }
          }}
        >
          ↻
        </Button>
      </Box>

      <TextField
        margin="normal"
        required
        fullWidth
        id="captcha"
        label="Enter Captcha"
        name="captcha"
        value={formData.captcha}
        onChange={handleChange}
        error={Boolean(error)}
        helperText={error}
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
        disabled={loading || !formData.phone || !formData.captcha}
        sx={{ mt: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : 'Track Repair'}
      </Button>
    </Box>
  );
} 