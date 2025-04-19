'use client';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { gridClasses } from '@mui/x-data-grid';

// Extend the theme to include custom components
declare module '@mui/material/styles' {
  interface Components {
    MuiDataGrid?: {
      styleOverrides?: {
        root?: any;
        columnHeader?: any;
        row?: any;
      };
    };
  }
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#EE6417', // Orange - Primary color
      light: '#ff8545',
      dark: '#b54000',
      contrastText: '#fff',
    },
    secondary: {
      main: '#3aa986', // Green - Secondary color
      light: '#6ddbb4',
      dark: '#00795b',
      contrastText: '#fff',
    },
    background: {
      default: '#f8f9fa',
      paper: '#fff',
    },
    text: {
      primary: '#2d3748',
      secondary: '#718096',
    },
    divider: 'rgba(0, 0, 0, 0.06)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.7,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.7,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          padding: '8px 20px',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          },
          transition: 'all 0.2s ease-in-out',
        },
        contained: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
          '&:hover': {
            boxShadow: '0px 8px 30px rgba(0, 0, 0, 0.08)',
          },
          transition: 'box-shadow 0.3s ease-in-out',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#EE6417',
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '16px',
        },
        head: {
          fontWeight: 600,
          backgroundColor: '#f8fafc',
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          backgroundColor: '#fff',
          '& .MuiDataGrid-cell:focus': {
            outline: 'none',
          },
        },
        columnHeader: {
          backgroundColor: '#f8fafc',
          fontWeight: 600,
        },
        row: {
          '&:nth-of-type(even)': {
            backgroundColor: '#fafafa',
          },
          '&:hover': {
            backgroundColor: '#f1f5f9',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },
});

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
} 