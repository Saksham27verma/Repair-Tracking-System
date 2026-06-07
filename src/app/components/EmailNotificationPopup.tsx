'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { EmailOutlined } from '@mui/icons-material';

interface EmailNotificationPopupProps {
  open: boolean;
  onClose: () => void;
  repairId: string;
  initialEmail?: string;
}

export default function EmailNotificationPopup({
  open,
  onClose,
  repairId,
  initialEmail = ''
}: EmailNotificationPopupProps) {
  console.log('EmailNotificationPopup rendering with props:', { open, repairId, initialEmail });
  
  const [email, setEmail] = useState(initialEmail);
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Clear error when popup opens or closes
  useEffect(() => {
    if (open) {
      setError(null);
      setSuccess(false);
      console.log('EmailNotificationPopup opened');
    } else {
      console.log('EmailNotificationPopup closed');
    }
  }, [open]);

  const handleSave = async () => {
    if (enableNotifications && !isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!repairId) {
      setError('No repair ID provided');
      console.error('Attempted to save without a repairId');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('Saving notification preferences:', {
        repairId,
        email: enableNotifications ? email : null,
        preference: enableNotifications ? 'email' : 'none'
      });
      
      const response = await fetch('/api/notification-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repairId,
          email: enableNotifications ? email : null,
          preference: enableNotifications ? 'email' : 'none'
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update notification preferences';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          console.error('Error parsing error response:', jsonError);
        }
        throw new Error(errorMessage);
      }

      console.log('Successfully saved notification preferences');
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      console.error('Error saving notification preferences:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
        <Box display="flex" alignItems="center" gap={1}>
          <EmailOutlined />
          <Typography variant="h6">Email Notifications</Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: 2, mt: 2 }}>
        {success ? (
          <Alert severity="success" sx={{ my: 2 }}>
            Notification preferences saved successfully!
          </Alert>
        ) : (
          <>
            <Typography variant="body1" paragraph>
              Would you like to receive email notifications about updates to your repair status?
            </Typography>

            <FormControlLabel
              control={
                <Checkbox
                  checked={enableNotifications}
                  onChange={(e) => setEnableNotifications(e.target.checked)}
                  color="primary"
                />
              }
              label="Yes, keep me updated via email"
              sx={{ mb: 2, display: 'block' }}
            />

            {enableNotifications && (
              <TextField
                label="Email Address"
                type="email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!error}
                helperText={error}
                disabled={loading}
                required
                sx={{ mb: 2 }}
              />
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                {error}
              </Alert>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        {!success && (
          <>
            <Button onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              color="primary"
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              Save Preferences
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
} 