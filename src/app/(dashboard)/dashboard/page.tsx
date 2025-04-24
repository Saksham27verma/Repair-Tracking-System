import { Box, Typography } from '@mui/material';
import DashboardCharts from './_components/DashboardCharts';
import PageHeader from '@/app/components/PageHeader';
import EmailPopupHandler from './EmailPopupHandler';
import { Suspense } from 'react';

export default function DashboardPage() {
  return (
    <div>
      {/* Client component to handle email popup wrapped in Suspense */}
      <Suspense fallback={null}>
        <EmailPopupHandler />
      </Suspense>
      
      <PageHeader 
        title="Dashboard" 
      />
      <DashboardCharts 
        initialStatusCounts={[]}
        initialDailyCounts={[]}
      />
    </div>
  );
} 