'use client';

import React from 'react';
import { Button, Box } from '@mui/material';
import { EmailOutlined } from '@mui/icons-material';

interface EmailNotificationButtonProps {
  repairId: string;
}

export default function EmailNotificationButton({ repairId }: EmailNotificationButtonProps) {
  // Simply create a mailto link for email notifications
  return (
    <Box>
      <Button
        variant="outlined"
        color="primary"
        startIcon={<EmailOutlined />}
        href={`mailto:hearinghopenotifications@gmail.com?subject=Repair%20Tracking%20Update%20-%20${repairId}&body=Please%20update%20me%20about%20my%20repair%20status%20for%20repair%20ID:%20${repairId}`}
        sx={{ py: 1.5, width: '100%' }}
      >
        Email About Status
      </Button>
    </Box>
  );
} 