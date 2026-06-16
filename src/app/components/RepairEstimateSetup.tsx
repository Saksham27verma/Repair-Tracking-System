'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { RequestQuote as QuoteIcon } from '@mui/icons-material';
import { formatCurrency } from '@/lib/invoice-tax';

interface RepairEstimateSetupProps {
  repairId: string;
  existingManufacturerEstimate?: number | null;
  existingMarkup?: number | null;
  onSaved?: () => void;
}

export default function RepairEstimateSetup({
  repairId,
  existingManufacturerEstimate,
  existingMarkup,
  onSaved,
}: RepairEstimateSetupProps) {
  const [manufacturerEstimate, setManufacturerEstimate] = useState(
    existingManufacturerEstimate != null ? String(existingManufacturerEstimate) : ''
  );
  const [hopeMarkup, setHopeMarkup] = useState(
    existingMarkup != null ? String(existingMarkup) : ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const mfgAmount = Number(manufacturerEstimate) || 0;
  const markupAmount = Number(hopeMarkup) || 0;
  const customerQuote = Math.round((mfgAmount + markupAmount) * 100) / 100;

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/repairs/${repairId}/estimate-quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manufacturer_estimate: mfgAmount,
          hope_markup: markupAmount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save quote');

      setSuccess(data.message);
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        mb: 3,
        borderRadius: 2.5,
        border: '2px solid',
        borderColor: '#3B82F6',
        bgcolor: '#EFF6FF',
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <QuoteIcon sx={{ color: '#2563EB', mt: 0.25 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Set customer quote (before return)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Enter the manufacturer&apos;s estimate while the device is still with them. The patient
            must approve before you can log the return. If they decline, schedule return without
            repair.
          </Typography>

          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Manufacturer Estimate"
              value={manufacturerEstimate}
              onChange={(e) => setManufacturerEstimate(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                inputProps: { min: 0, step: 0.01 },
              }}
              helperText="What the manufacturer quoted for this repair"
            />
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Your Markup"
              value={hopeMarkup}
              onChange={(e) => setHopeMarkup(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                inputProps: { min: 0, step: 0.01 },
              }}
            />
            {customerQuote > 0 && (
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#FFFFFF', border: '1px solid #BFDBFE' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Patient will be asked to approve
                </Typography>
                <Typography variant="h6" fontWeight={800} color="primary.main">
                  {formatCurrency(customerQuote)}
                </Typography>
              </Box>
            )}
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {success}
            </Alert>
          )}

          <Button
            variant="contained"
            sx={{ mt: 2 }}
            disabled={loading || manufacturerEstimate === ''}
            onClick={handleSave}
          >
            {loading ? 'Saving…' : 'Save quote'}
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
