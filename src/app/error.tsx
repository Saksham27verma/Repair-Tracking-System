'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Box, Button, Container, Typography } from '@mui/material';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
      <Typography variant="h2" component="h1" gutterBottom>
        Something went wrong
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        An unexpected error occurred while loading this page.
      </Typography>
      <Box mt={4} display="flex" gap={2} justifyContent="center">
        <Button variant="contained" color="primary" onClick={() => reset()}>
          Try again
        </Button>
        <Button component={Link} href="/" variant="outlined">
          Go home
        </Button>
      </Box>
    </Container>
  );
}
