'use client';

import { Box, Typography, Breadcrumbs, Link as MuiLink } from '@mui/material';
import { ReactNode } from 'react';
import NextLink from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageShellProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  children: ReactNode;
}

export default function PageShell({ title, subtitle, breadcrumbs, actions, children }: PageShellProps) {
  return (
    <Box>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 2, fontSize: '0.875rem' }}>
          {breadcrumbs.map((item, index) =>
            item.href ? (
              <MuiLink
                key={index}
                component={NextLink}
                href={item.href}
                underline="hover"
                color="text.secondary"
                sx={{ fontSize: 'inherit' }}
              >
                {item.label}
              </MuiLink>
            ) : (
              <Typography key={index} color="text.primary" sx={{ fontSize: 'inherit', fontWeight: 500 }}>
                {item.label}
              </Typography>
            )
          )}
        </Breadcrumbs>
      )}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              letterSpacing: '-0.02em',
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -6,
                left: 0,
                width: 40,
                height: 3,
                bgcolor: 'primary.main',
                borderRadius: 2,
              },
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>{actions}</Box>}
      </Box>
      {children}
    </Box>
  );
}
