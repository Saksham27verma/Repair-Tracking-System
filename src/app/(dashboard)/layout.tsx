'use client';

import {
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  Toolbar,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Build as RepairIcon,
  People as CustomersIcon,
  Assessment as ReportsIcon,
  Description as ReceiptIcon,
  Receipt as InvoiceIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Settings as SettingsIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AuthCheck from './_components/AuthCheck';
import { useAuth } from '../context/AuthContext';

const drawerWidthExpanded = 256;
const drawerWidthCollapsed = 72;
const HEADER_HEIGHT = 64;

const SIDEBAR_BG = '#0F1629';
const SIDEBAR_ACTIVE_BG = 'rgba(238, 100, 23, 0.18)';
const SIDEBAR_HOVER_BG = 'rgba(255, 255, 255, 0.06)';
const SIDEBAR_TEXT = 'rgba(255,255,255,0.75)';
const SIDEBAR_TEXT_ACTIVE = '#ffffff';
const SIDEBAR_ICON = 'rgba(255,255,255,0.5)';
const SIDEBAR_ICON_ACTIVE = '#EE6417';
const SIDEBAR_BORDER = 'rgba(255,255,255,0.06)';
const ORANGE = '#EE6417';

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon fontSize="small" />, href: '/dashboard', group: 'main' },
  { text: 'Repairs', icon: <RepairIcon fontSize="small" />, href: '/dashboard/repairs', group: 'main' },
  { text: 'Customers', icon: <CustomersIcon fontSize="small" />, href: '/dashboard/customers', group: 'main' },
  { text: 'Invoices', icon: <InvoiceIcon fontSize="small" />, href: '/dashboard/invoices', group: 'main' },
  { text: 'Reports', icon: <ReportsIcon fontSize="small" />, href: '/dashboard/reports', group: 'data' },
  { text: 'Templates', icon: <ReceiptIcon fontSize="small" />, href: '/dashboard/settings/receipt', group: 'data' },
];

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview & key metrics' },
  '/dashboard/repairs': { title: 'Repairs', subtitle: 'Manage repair orders' },
  '/dashboard/customers': { title: 'Customers', subtitle: 'Customer management' },
  '/dashboard/invoices': { title: 'Invoices', subtitle: 'Billing & invoices' },
  '/dashboard/reports': { title: 'Reports', subtitle: 'Analytics & insights' },
  '/dashboard/settings/receipt': { title: 'Templates', subtitle: 'Receipt & invoice templates' },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const drawerWidth = collapsed ? drawerWidthCollapsed : drawerWidthExpanded;

  const handleLogout = () => {
    setAnchorEl(null);
    logout();
    router.push('/sign-in');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const getPageInfo = () => {
    const keys = Object.keys(pageTitles).sort((a, b) => b.length - a.length);
    for (const key of keys) {
      if (pathname === key || pathname.startsWith(key + '/')) {
        return pageTitles[key];
      }
    }
    return { title: 'Dashboard', subtitle: '' };
  };

  const pageInfo = getPageInfo();

  const sectionLabel = (text: string) =>
    !collapsed ? (
      <Typography
        variant="caption"
        sx={{
          color: 'rgba(255,255,255,0.3)',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontSize: '0.65rem',
          px: 2,
          pt: 2.5,
          pb: 0.5,
          display: 'block',
        }}
      >
        {text}
      </Typography>
    ) : (
      <Box sx={{ pt: 2, pb: 0.5, display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ width: 24, height: 1, bgcolor: SIDEBAR_BORDER }} />
      </Box>
    );

  const drawer = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(180deg, #0F1629 0%, #111827 100%)`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'radial-gradient(ellipse at 20% 0%, rgba(238,100,23,0.08) 0%, transparent 60%)',
          pointerEvents: 'none',
        },
      }}
    >
      {/* Logo area */}
      <Box
        component={Link}
        href="/dashboard"
        sx={{
          mx: collapsed ? 1 : 1.5,
          mt: 1.5,
          mb: 1,
          px: collapsed ? 1 : 1.5,
          py: collapsed ? 1 : 1.25,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: collapsed ? 52 : 64,
          borderRadius: 2.5,
          flexShrink: 0,
          textDecoration: 'none',
          bgcolor: '#ffffff',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.9)',
          transition: 'all 0.25s ease',
          '&:hover': {
            boxShadow: '0 6px 24px rgba(238,100,23,0.2), inset 0 1px 0 rgba(255,255,255,0.9)',
            transform: 'translateY(-1px)',
          },
        }}
      >
        {collapsed ? (
          <Image
            src="/images/hopelogo.svg"
            alt="Hope Hearing"
            width={40}
            height={40}
            style={{ objectFit: 'contain' }}
            priority
          />
        ) : (
          <Image
            src="/images/hopelogo.svg"
            alt="Hope Hearing"
            width={160}
            height={50}
            style={{ objectFit: 'contain', maxWidth: '100%', height: 'auto' }}
            priority
          />
        )}
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 1, '&::-webkit-scrollbar': { display: 'none' } }}>
        {sectionLabel('Main')}
        <List sx={{ px: 1, py: 0 }}>
          {menuItems.filter((i) => i.group === 'main').map((item) => {
            const active = isActive(item.href);
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <Tooltip title={collapsed ? item.text : ''} placement="right" arrow>
                  <ListItemButton
                    component={Link}
                    href={item.href}
                    sx={{
                      borderRadius: '10px',
                      minHeight: 42,
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      px: collapsed ? 0 : 1.5,
                      mx: 0,
                      bgcolor: active ? SIDEBAR_ACTIVE_BG : 'transparent',
                      border: `1px solid ${active ? 'rgba(238,100,23,0.3)' : 'transparent'}`,
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.2s ease',
                      '&::before': active
                        ? {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            top: '20%',
                            bottom: '20%',
                            width: 3,
                            borderRadius: '0 4px 4px 0',
                            background: `linear-gradient(180deg, ${ORANGE}, #ff8545)`,
                          }
                        : {},
                      '&:hover': {
                        bgcolor: active ? SIDEBAR_ACTIVE_BG : SIDEBAR_HOVER_BG,
                        transform: 'translateX(2px)',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: active ? SIDEBAR_ICON_ACTIVE : SIDEBAR_ICON,
                        minWidth: collapsed ? 0 : 36,
                        justifyContent: 'center',
                        transition: 'color 0.2s',
                        ...(active && {
                          filter: `drop-shadow(0 0 6px ${ORANGE})`,
                        }),
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {!collapsed && (
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          fontWeight: active ? 600 : 400,
                          color: active ? SIDEBAR_TEXT_ACTIVE : SIDEBAR_TEXT,
                          fontSize: '0.875rem',
                          letterSpacing: active ? '-0.01em' : 'normal',
                        }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            );
          })}
        </List>

        {sectionLabel('Data')}
        <List sx={{ px: 1, py: 0 }}>
          {menuItems.filter((i) => i.group === 'data').map((item) => {
            const active = isActive(item.href);
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <Tooltip title={collapsed ? item.text : ''} placement="right" arrow>
                  <ListItemButton
                    component={Link}
                    href={item.href}
                    sx={{
                      borderRadius: '10px',
                      minHeight: 42,
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      px: collapsed ? 0 : 1.5,
                      bgcolor: active ? SIDEBAR_ACTIVE_BG : 'transparent',
                      border: `1px solid ${active ? 'rgba(238,100,23,0.3)' : 'transparent'}`,
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.2s ease',
                      '&::before': active
                        ? {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            top: '20%',
                            bottom: '20%',
                            width: 3,
                            borderRadius: '0 4px 4px 0',
                            background: `linear-gradient(180deg, ${ORANGE}, #ff8545)`,
                          }
                        : {},
                      '&:hover': {
                        bgcolor: active ? SIDEBAR_ACTIVE_BG : SIDEBAR_HOVER_BG,
                        transform: 'translateX(2px)',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: active ? SIDEBAR_ICON_ACTIVE : SIDEBAR_ICON,
                        minWidth: collapsed ? 0 : 36,
                        justifyContent: 'center',
                        transition: 'color 0.2s',
                        ...(active && {
                          filter: `drop-shadow(0 0 6px ${ORANGE})`,
                        }),
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {!collapsed && (
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          fontWeight: active ? 600 : 400,
                          color: active ? SIDEBAR_TEXT_ACTIVE : SIDEBAR_TEXT,
                          fontSize: '0.875rem',
                        }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Bottom section: user + collapse */}
      <Box
        sx={{
          borderTop: `1px solid ${SIDEBAR_BORDER}`,
          flexShrink: 0,
        }}
      >
        {/* Collapse toggle */}
        <Box
          sx={{
            display: { xs: 'none', sm: 'flex' },
            justifyContent: collapsed ? 'center' : 'flex-end',
            px: collapsed ? 0 : 1.5,
            py: 1,
          }}
        >
          <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} placement="right">
            <IconButton
              onClick={() => setCollapsed(!collapsed)}
              size="small"
              sx={{
                color: 'rgba(255,255,255,0.4)',
                bgcolor: 'rgba(255,255,255,0.06)',
                border: `1px solid ${SIDEBAR_BORDER}`,
                width: 28,
                height: 28,
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.8)',
                },
                transition: 'all 0.2s',
              }}
            >
              {collapsed ? <ChevronRightIcon sx={{ fontSize: 16 }} /> : <ChevronLeftIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* User profile */}
        <Box
          sx={{
            px: collapsed ? 1 : 1.5,
            pb: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            <Avatar
              sx={{
                width: 34,
                height: 34,
                background: `linear-gradient(135deg, ${ORANGE} 0%, #ff8545 100%)`,
                fontSize: '0.8rem',
                fontWeight: 700,
                boxShadow: `0 2px 8px rgba(238,100,23,0.4)`,
              }}
            >
              HH
            </Avatar>
            <CircleIcon
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                fontSize: 10,
                color: '#10B981',
                filter: 'drop-shadow(0 0 3px #10B981)',
              }}
            />
          </Box>
          {!collapsed && (
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{ color: '#ffffff', fontWeight: 600, fontSize: '0.8rem', lineHeight: 1.3, noWrap: true }}
              >
                Hope Hearing
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.68rem', lineHeight: 1 }}
              >
                Administrator
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      <AuthCheck />
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />

        {/* Header */}
        <Box
          component="header"
          sx={{
            position: 'fixed',
            top: 0,
            right: 0,
            left: { xs: 0, sm: `${drawerWidth}px` },
            zIndex: (theme) => theme.zIndex.drawer + 1,
            transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            height: HEADER_HEIGHT,
            display: 'flex',
            alignItems: 'center',
            px: { xs: 2, sm: 3 },
            bgcolor: 'rgba(248,250,252,0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(226,232,240,0.8)',
            boxShadow: '0 1px 0 rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)',
          }}
        >
          {/* Mobile menu button */}
          <IconButton
            onClick={() => setMobileOpen(!mobileOpen)}
            size="small"
            sx={{
              mr: 1.5,
              display: { sm: 'none' },
              color: 'text.secondary',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' },
            }}
          >
            <MenuIcon fontSize="small" />
          </IconButton>

          {/* Page title */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: '1rem',
                color: 'text.primary',
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
              }}
            >
              {pageInfo.title}
            </Typography>
            {pageInfo.subtitle && (
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.72rem',
                  lineHeight: 1,
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                {pageInfo.subtitle}
              </Typography>
            )}
          </Box>

          {/* Right section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Status badge */}
            <Chip
              icon={<CircleIcon sx={{ fontSize: '8px !important', color: '#10B981 !important' }} />}
              label="Live"
              size="small"
              sx={{
                height: 26,
                display: { xs: 'none', md: 'flex' },
                bgcolor: 'rgba(16,185,129,0.08)',
                color: '#059669',
                border: '1px solid rgba(16,185,129,0.2)',
                fontWeight: 600,
                fontSize: '0.7rem',
                '& .MuiChip-icon': { ml: '6px' },
              }}
            />

            {/* Divider */}
            <Box
              sx={{
                width: 1,
                height: 28,
                bgcolor: 'divider',
                display: { xs: 'none', sm: 'block' },
                mx: 0.5,
              }}
            />

            {/* User button */}
            <Box
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                borderRadius: 2,
                px: 1,
                py: 0.5,
                border: '1px solid transparent',
                transition: 'all 0.18s ease',
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.04)',
                  border: '1px solid rgba(0,0,0,0.08)',
                },
              }}
            >
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    background: `linear-gradient(135deg, ${ORANGE} 0%, #ff8545 100%)`,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    boxShadow: `0 2px 8px rgba(238,100,23,0.3)`,
                  }}
                >
                  HH
                </Avatar>
                <CircleIcon
                  sx={{
                    position: 'absolute',
                    bottom: -1,
                    right: -1,
                    fontSize: 9,
                    color: '#10B981',
                    bgcolor: 'white',
                    borderRadius: '50%',
                  }}
                />
              </Box>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'text.primary', lineHeight: 1.3 }}
                >
                  Hope Hearing
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ fontSize: '0.68rem', color: 'text.secondary', lineHeight: 1 }}
                >
                  Admin
                </Typography>
              </Box>
              <ArrowDownIcon sx={{ fontSize: 16, color: 'text.secondary', display: { xs: 'none', sm: 'block' } }} />
            </Box>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                elevation: 0,
                sx: {
                  mt: 1,
                  minWidth: 200,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  overflow: 'visible',
                  '&::before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: -6,
                    right: 20,
                    width: 12,
                    height: 12,
                    bgcolor: 'background.paper',
                    borderTop: '1px solid',
                    borderLeft: '1px solid',
                    borderColor: 'divider',
                    transform: 'rotate(45deg)',
                    zIndex: 0,
                  },
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" fontWeight={600}>
                  Hope Hearing
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Administrator
                </Typography>
              </Box>
              <MenuItem
                onClick={handleLogout}
                sx={{
                  mx: 1,
                  my: 0.5,
                  borderRadius: 1.5,
                  gap: 1.5,
                  color: 'error.main',
                  '&:hover': { bgcolor: 'rgba(239,68,68,0.06)' },
                }}
              >
                <LogoutIcon fontSize="small" />
                <Typography variant="body2" fontWeight={500}>Sign out</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        {/* Sidebar nav */}
        <Box
          component="nav"
          sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 }, transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
          {/* Mobile drawer */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': {
                width: drawerWidthExpanded,
                border: 'none',
                boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
              },
            }}
          >
            {drawer}
          </Drawer>
          {/* Desktop permanent drawer */}
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': {
                width: drawerWidth,
                transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                overflowX: 'hidden',
                border: 'none',
                boxShadow: '4px 0 24px rgba(0,0,0,0.08)',
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>

        {/* Main content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, md: 3 },
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            bgcolor: 'background.default',
            minHeight: '100vh',
            transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <Toolbar sx={{ minHeight: `${HEADER_HEIGHT}px !important` }} />
          {children}
        </Box>
      </Box>
    </>
  );
}
