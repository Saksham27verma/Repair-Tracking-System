import dynamic from 'next/dynamic';
import { Box, CircularProgress } from '@mui/material';

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
  return <DynamicReportsPage />;
} 