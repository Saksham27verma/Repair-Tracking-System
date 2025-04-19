'use client';

import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import { EstimateStatus } from '@/app/types/database';
import { supabase } from '@/lib/supabase';

interface EstimateApprovalProps {
  repairId: string;
  estimate: number;
  status: EstimateStatus;
  onStatusChange?: (newStatus: EstimateStatus) => void;
}

export default function EstimateApproval({ 
  repairId, 
  estimate, 
  status = 'Pending',
  onStatusChange 
}: EstimateApprovalProps) {
  const [currentStatus, setCurrentStatus] = useState<EstimateStatus>(status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogAction, setDialogAction] = useState<'approve' | 'decline' | null>(null);

  // Don't show if there's no estimate or it's not pending
  if (!estimate || currentStatus !== 'Pending') {
    return null;
  }

  const handleOpenDialog = (action: 'approve' | 'decline') => {
    setDialogAction(action);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDialogAction(null);
  };

  const updateEstimateStatus = async (newStatus: EstimateStatus) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      console.log(`🔄 Updating estimate status to: ${newStatus}`);
      
      // First approach: Use the API
      const response = await fetch('/api/estimate-approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repairId,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('❌ API error:', data);
        throw new Error(data.message || 'Failed to update estimate status');
      }

      const result = await response.json();
      console.log('✅ API success:', result);
      
      // For redundancy, also attempt a direct update with Supabase client
      try {
        console.log('🔄 Attempting direct database update as backup');
        
        // First, find the repair by repair_id
        const { data: repair, error: findError } = await supabase
          .from('repairs')
          .select('id')
          .eq('repair_id', repairId)
          .single();
          
        if (findError || !repair) {
          console.warn('⚠️ Direct update - could not find repair:', findError);
        } else {
          console.log(`✅ Found repair with ID: ${repair.id}`);
          
          // Directly update the database
          const { error: updateError } = await supabase
            .from('repairs')
            .update({
              estimate_status: newStatus,
              estimate_approval_date: new Date().toISOString()
            })
            .eq('id', repair.id);
            
          if (updateError) {
            console.warn('⚠️ Direct update failed:', updateError);
          } else {
            console.log('✅ Direct update succeeded');
          }
        }
      } catch (directUpdateError) {
        console.warn('⚠️ Error in direct update:', directUpdateError);
        // Don't throw - this is just a backup approach
      }

      setCurrentStatus(newStatus);
      setSuccessMessage(result.message);
      
      // Notify parent component if callback provided
      if (onStatusChange) {
        onStatusChange(newStatus);
      }
      
      // Give feedback to the user with a success message, 
      // then reload the page after 2 seconds
      setTimeout(() => {
        console.log('🔄 Reloading page');
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error('❌ Error updating estimate:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      handleCloseDialog();
    }
  };

  return (
    <>
      <Paper elevation={3} sx={{ p: 3, mb: 4, borderLeft: '4px solid #f5a623' }}>
        <Typography variant="h6" gutterBottom color="primary">
          Estimate Approval Required
        </Typography>
        <Typography variant="body1" paragraph>
          The manufacturer has provided an estimate for your repair:
        </Typography>
        
        <Box sx={{ my: 3, textAlign: 'center' }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
            ₹{estimate}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Repair Estimate
          </Typography>
        </Box>
        
        <Typography variant="body2" paragraph>
          Please approve or decline this estimate to proceed with the repair.
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<CheckIcon />}
            onClick={() => handleOpenDialog('approve')}
            disabled={loading}
            sx={{ minWidth: '120px' }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Approve'}
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<CloseIcon />}
            onClick={() => handleOpenDialog('decline')}
            disabled={loading}
            sx={{ minWidth: '120px' }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Decline'}
          </Button>
        </Box>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {dialogAction === 'approve' ? 'Approve Estimate' : 'Decline Estimate'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {dialogAction === 'approve'
              ? `Are you sure you want to approve the repair estimate of ₹${estimate}? Your repair will proceed with this cost.`
              : `Are you sure you want to decline the repair estimate of ₹${estimate}? Your device will be returned to you without being repaired.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={() => updateEstimateStatus(dialogAction === 'approve' ? 'Approved' : 'Declined')}
            color={dialogAction === 'approve' ? 'primary' : 'error'}
            variant="contained"
            autoFocus
          >
            {dialogAction === 'approve' ? 'Approve' : 'Decline'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
} 