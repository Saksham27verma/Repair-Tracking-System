'use client';

import { ReactNode } from 'react';
import { Box, Typography, Breadcrumbs, Link as MuiLink } from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface PageHeaderProps {
  title: string;
  action?: ReactNode;
}

export default function PageHeader({ title, action }: PageHeaderProps) {
  const pathname = usePathname();
  const paths = pathname.split('/').filter(Boolean);

  return (
    <Box sx={{ mb: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs
        aria-label="breadcrumb"
        sx={{
          mb: 2,
          '& .MuiBreadcrumbs-ol': {
            fontSize: '0.875rem',
          },
        }}
      >
        <MuiLink
          component={Link}
          href="/dashboard"
          color="text.secondary"
          sx={{ 
            textDecoration: 'none',
            '&:hover': { color: 'primary.main' }
          }}
        >
          Dashboard
        </MuiLink>
        {paths.slice(1).map((path, index) => {
          const href = `/dashboard/${paths.slice(1, index + 2).join('/')}`;
          const isLast = index === paths.length - 2;
          const formattedPath = path
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          return isLast ? (
            <Typography key={path} color="text.primary" fontWeight={500}>
              {formattedPath}
            </Typography>
          ) : (
            <MuiLink
              key={path}
              component={Link}
              href={href}
              color="text.secondary"
              sx={{ 
                textDecoration: 'none',
                '&:hover': { color: 'primary.main' }
              }}
            >
              {formattedPath}
            </MuiLink>
          );
        })}
      </Breadcrumbs>

      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -1,
              left: 0,
              width: '2em',
              height: '3px',
              backgroundColor: 'primary.main',
              borderRadius: '2px',
            },
          }}
        >
          {title}
        </Typography>
        {action && <Box>{action}</Box>}
      </Box>
    </Box>
  );
} 