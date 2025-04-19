'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Email as EmailIcon, Sms as SmsIcon, Notifications as NotificationsIcon } from '@mui/icons-material';

interface NotificationPreferencesProps {
  repairId: string;
}

interface Preferences {
  method: 'email' | 'sms' | 'both';
  email: string | null;
  phone: string;
}

export default function NotificationPreferences({ repairId }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<Preferences>({
    method: 'both',
    email: '',
    phone: '',
  });
  const [originalPreferences, setOriginalPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Fetch current preferences
    async function fetchPreferences() {
      if (!repairId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/notification-preferences?repairId=${repairId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch notification preferences');
        }
        
        setPreferences(data.preferences);
        setOriginalPreferences(data.preferences);
      } catch (err) {
        console.error('Error fetching preferences:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    
    fetchPreferences();
  }, [repairId]);

  const handleMethodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPreferences({
      ...preferences,
      method: event.target.value as 'email' | 'sms' | 'both',
    });
  };

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPreferences({
      ...preferences,
      email: event.target.value,
    });
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    setSaveLoading(true);
    
    try {
      // Validate email if email notifications are enabled
      if ((preferences.method === 'email' || preferences.method === 'both') && 
          (!preferences.email || !isValidEmail(preferences.email))) {
        throw new Error('Please provide a valid email address');
      }
      
      const response = await fetch('/api/notification-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repairId,
          preferences: {
            method: preferences.method,
            email: preferences.email,
          },
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update notification preferences');
      }
      
      setSuccess('Your notification preferences have been updated successfully');
      setOriginalPreferences(preferences);
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaveLoading(false);
    }
  };
  
  // Check if changes were made
  const hasChanges = originalPreferences && (
    originalPreferences.method !== preferences.method ||
    originalPreferences.email !== preferences.email
  );
  
  // Basic email validation
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <NotificationsIcon /> Notification Preferences
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Choose how you would like to receive updates about your repair status:
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      <FormControl component="fieldset" sx={{ mb: 2, width: '100%' }}>
        <RadioGroup
          name="notification-method"
          value={preferences.method}
          onChange={handleMethodChange}
        >
          <FormControlLabel 
            value="email" 
            control={<Radio />} 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmailIcon fontSize="small" />
                <Typography>Email only</Typography>
              </Box>
            } 
          />
          <FormControlLabel 
            value="sms" 
            control={<Radio />} 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SmsIcon fontSize="small" />
                <Typography>SMS only</Typography>
              </Box>
            } 
          />
          <FormControlLabel 
            value="both" 
            control={<Radio />} 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationsIcon fontSize="small" />
                <Typography>Both Email and SMS</Typography>
              </Box>
            } 
          />
        </RadioGroup>
      </FormControl>
      
      {/* Show email field if email or both is selected */}
      {(preferences.method === 'email' || preferences.method === 'both') && (
        <TextField
          fullWidth
          label="Email Address"
          value={preferences.email || ''}
          onChange={handleEmailChange}
          margin="normal"
          type="email"
          error={preferences.email !== null && preferences.email !== '' && !isValidEmail(preferences.email)}
          helperText={preferences.email !== null && preferences.email !== '' && !isValidEmail(preferences.email) ? 'Please enter a valid email address' : ''}
        />
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saveLoading || !hasChanges}
          sx={{ minWidth: 120 }}
        >
          {saveLoading ? <CircularProgress size={24} /> : 'Save Preferences'}
        </Button>
      </Box>
    </Paper>
  );
} 