'use client';

import { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface RefreshButtonProps {
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
}

export default function RefreshButton({ 
  variant = 'contained', 
  color = 'primary',
  size = 'medium',
  fullWidth = false
}: RefreshButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRefresh = () => {
    setLoading(true);
    
    // Force a hard refresh of the page to get the latest data
    router.refresh();
    
    // Reset loading after a short delay
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  return (
    <Button
      variant={variant}
      color={color}
      onClick={handleRefresh}
      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
      disabled={loading}
      fullWidth={fullWidth}
      size={size}
    >
      {loading ? 'Refreshing...' : 'Refresh Status'}
    </Button>
  );
} 