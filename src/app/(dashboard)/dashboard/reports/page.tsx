'use client';

import dynamic from 'next/dynamic';
import { Box, CircularProgress } from '@mui/material';
import PasswordProtection from '@/app/components/PasswordProtection';

// Dynamically import the reports page component with no SSR
const DynamicReportsPage = dynamic(
  () => import('./_components/ReportsPageContent'),
  {
    ssr: false,
    loading: () => (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    ),
  }
);

export default function ReportsPage() {
  return (
    <PasswordProtection 
      protectedAreaName="reports-admin"
      key={Date.now()}
    >
      <DynamicReportsPage />
    </PasswordProtection>
  );
} 