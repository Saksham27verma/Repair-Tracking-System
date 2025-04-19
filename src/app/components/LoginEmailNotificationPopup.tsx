'use client';

import React, { useState } from 'react';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Alert,
  Box
} from '@mui/material';
import { MailOutline as EmailIcon } from '@mui/icons-material';

interface LoginEmailNotificationPopupProps {
  open: boolean;
  onClose: () => void;
  onSave: (email: string) => void;
  initialEmail?: string;
}

export default function LoginEmailNotificationPopup({
  open,
  onClose,
  onSave,
  initialEmail = ''
}: LoginEmailNotificationPopupProps) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    // Validate email
    if (!email || !isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      onSave(email);
      setSuccess(true);
      
      // Close after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error saving email:', error);
      setError('Failed to save your email. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <EmailIcon color="primary" />
        Get Email Notifications
      </DialogTitle>
      
      <DialogContent>
        {success ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            Your email has been saved successfully!
          </Alert>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Typography variant="body1" sx={{ mb: 2 }}>
              Would you like to receive email notifications about your repair status updates?
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                disabled={loading}
                helperText="We'll only use this to send you updates about your repairs"
              />
            </Box>
          </>
        )}
      </DialogContent>
      
      {!success && (
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Skip
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={loading || !email}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
} 