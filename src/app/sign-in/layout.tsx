import { Box } from '@mui/material';

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        p: 2,
        bgcolor: '#f5f5f5',
      }}
    >
      {children}
    </Box>
  );
} 