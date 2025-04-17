'use client';

import ThemeRegistry from './ThemeRegistry';
import { AuthProvider } from '../context/AuthContext';
import { AlertProvider } from './AlertProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeRegistry>
        <AlertProvider>
          {children}
        </AlertProvider>
      </ThemeRegistry>
    </AuthProvider>
  );
} 