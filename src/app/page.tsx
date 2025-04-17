import { Box, Container, Typography, Paper, Button, Stack } from '@mui/material';
import Link from 'next/link';
import Image from 'next/image';
import RepairTrackingForm from './components/RepairTrackingForm';

export default function HomePage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 4, md: 0 },
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <Stack spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Box sx={{ width: 200, height: 70, position: 'relative' }}>
              <Image
                src="/images/hopelogo.svg"
                alt="Company Logo"
                fill
                style={{ objectFit: 'contain' }}
                priority
              />
            </Box>
            <Typography 
              variant="h3" 
              component="h1" 
              align="center" 
              sx={{ 
                fontWeight: 700,
                fontSize: { xs: '2rem', md: '2.5rem' },
                color: '#1e293b',
                mb: 1,
              }}
            >
              Hearing Aid Repair Tracking
            </Typography>
            <Typography 
              variant="h6" 
              component="h2" 
              align="center" 
              sx={{ 
                color: '#64748b',
                maxWidth: 500,
                fontSize: { xs: '1rem', md: '1.25rem' },
                mb: 2,
                lineHeight: 1.5,
              }}
            >
              Track your hearing aid repair status easily and efficiently
            </Typography>
          </Stack>

          <Paper
            elevation={0}
            sx={{
              p: 4,
              width: '100%',
              maxWidth: 500,
              borderRadius: 3,
              bgcolor: '#ffffff',
              border: '1px solid',
              borderColor: '#e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            }}
          >
            <RepairTrackingForm />
          </Paper>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#64748b',
                mb: 1.5,
                fontSize: '1rem',
              }}
            >
              Are you a staff member?
            </Typography>
            <Button
              component={Link}
              href="/sign-in"
              variant="contained"
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1.1rem',
                bgcolor: '#EE6417',
                color: '#ffffff',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                '&:hover': {
                  bgcolor: '#e85c0f',
                },
              }}
            >
              Staff Login
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
} 