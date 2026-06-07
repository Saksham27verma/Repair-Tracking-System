import { Box, Typography } from '@mui/material';
import CustomerForm from '../_components/CustomerForm';

export default function NewCustomerPage() {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        New Customer
      </Typography>
      <CustomerForm />
    </Box>
  );
} 