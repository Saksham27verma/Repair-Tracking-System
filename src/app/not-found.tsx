import { Container, Typography, Button, Box } from '@mui/material';
import Link from 'next/link';

export default function NotFound() {
  return (
    <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
      <Typography variant="h2" component="h1" gutterBottom>
        404 - Page Not Found
      </Typography>
      <Typography variant="h5" component="p" color="text.secondary" paragraph>
        The page you are looking for doesn't exist or has been moved.
      </Typography>
      
      <Box mt={4}>
        <Button 
          component={Link} 
          href="/"
          variant="contained" 
          color="primary" 
          size="large"
        >
          Return to Home
        </Button>
      </Box>
    </Container>
  );
} 