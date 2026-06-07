'use client';

import React from 'react';
import ThemeRegistry from './ThemeRegistry';
import { AlertProvider } from './AlertProvider';
import { AuthProvider } from '../context/AuthContext';

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