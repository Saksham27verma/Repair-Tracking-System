'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  Stack,
  CircularProgress,
  Chip,
  Alert,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { useRouter } from 'next/navigation';
import { RefreshRounded, AccessTimeFilledRounded } from '@mui/icons-material';
import { useAlert } from '@/app/components/AlertProvider';
import StatCard from '@/app/components/ui/StatCard';
import ContentCard from '@/app/components/ui/ContentCard';
import CenterActiveRepairs, { CenterActiveStats } from '@/app/components/CenterActiveRepairs';
import {
  Build as BuildIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CheckIcon,
  Inventory as InventoryIcon,
  Store as StoreIcon,
} from '@mui/icons-material';

interface StatusCount {
  status: string;
  count: number;
}

interface DailyCount {
  date: string;
  count: number;
}

interface CenterBreakdown {
  center_id: string;
  center_name: string;
  count: number;
}

interface DashboardChartsProps {
  initialStatusCounts: StatusCount[];
  initialDailyCounts: DailyCount[];
  initialCenterBreakdown?: CenterBreakdown[];
  initialCenterActiveStats?: CenterActiveStats[];
  initialInTransitCount?: number;
  initialTimestamp?: string;
}

export default function DashboardCharts({
  initialStatusCounts = [],
  initialDailyCounts = [],
  initialCenterBreakdown = [],
  initialCenterActiveStats = [],
  initialInTransitCount = 0,
  initialTimestamp,
}: DashboardChartsProps) {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>(initialStatusCounts);
  const [dailyCounts, setDailyCounts] = useState<DailyCount[]>(initialDailyCounts);
  const [centerBreakdown, setCenterBreakdown] = useState<CenterBreakdown[]>(initialCenterBreakdown);
  const [centerActiveStats, setCenterActiveStats] = useState<CenterActiveStats[]>(initialCenterActiveStats);
  const [inTransitCount, setInTransitCount] = useState(initialInTransitCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>(
    initialTimestamp || new Date().toISOString()
  );
  const hasAutoRetried = useRef(false);

  const fetchDashboardStats = useCallback(async (showSuccessMessage = false) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/dashboard-stats?t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Request failed (${response.status})`);
      }

      const data = await response.json();

      setStatusCounts(data.statusCounts || []);
      setDailyCounts(data.dailyCounts || []);
      setCenterBreakdown(data.centerBreakdown || []);
      setCenterActiveStats(data.centerActiveStats || []);
      setInTransitCount(data.inTransitCount || 0);
      setLastUpdated(data.timestamp || new Date().toISOString());

      if (showSuccessMessage) {
        showAlert('Dashboard refreshed successfully', 'success');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh dashboard data';
      console.error('Error fetching dashboard stats:', err);
      setError(message);
      if (showSuccessMessage) {
        showAlert('Failed to refresh dashboard data. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  const initialTotal = initialStatusCounts.reduce((sum, s) => sum + s.count, 0);

  useEffect(() => {
    if (initialTotal === 0 && !hasAutoRetried.current) {
      hasAutoRetried.current = true;
      fetchDashboardStats(false);
    }
  }, [initialTotal, fetchDashboardStats]);

  const statusCards = [
    {
      title: 'Active Repairs',
      count: statusCounts.find((s) => s.status === 'Received')?.count || 0,
      color: '#EE6417',
      status: 'Received',
      icon: <BuildIcon />,
    },
    {
      title: 'With Company',
      count: statusCounts.find((s) => s.status === 'Sent to Company for Repair')?.count || 0,
      color: '#3B82F6',
      status: 'Sent to Company for Repair',
      icon: <ShippingIcon />,
    },
    {
      title: 'Ready for Pickup',
      count: statusCounts.find((s) => s.status === 'Ready for Pickup')?.count || 0,
      color: '#3aa986',
      status: 'Ready for Pickup',
      icon: <InventoryIcon />,
    },
    {
      title: 'Completed',
      count: statusCounts.find((s) => s.status === 'Completed')?.count || 0,
      color: '#10B981',
      status: 'Completed',
      icon: <CheckIcon />,
    },
  ];

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    try {
      return new Date(lastUpdated).toLocaleTimeString();
    } catch {
      return '';
    }
  };

  const handleCardClick = (status: string) => {
    router.push(`/dashboard/repairs?status=${encodeURIComponent(status)}`);
  };

  const handleBarClick = (data: { activePayload?: { payload: { date: string } }[] }) => {
    if (data?.activePayload?.[0]) {
      const clickedDate = data.activePayload[0].payload.date;
      router.push(`/dashboard/repairs?date=${clickedDate}`);
    }
  };

  const handleDateRangeSubmit = () => {
    if (startDate && endDate) {
      router.push(`/dashboard/repairs?startDate=${startDate}&endDate=${endDate}`);
    }
  };

  const filteredChartData = dailyCounts.filter((item) => {
    if (!startDate && !endDate) return true;
    const itemDate = new Date(item.date);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (start && end) return itemDate >= start && itemDate <= end;
    if (start) return itemDate >= start;
    if (end) return itemDate <= end;
    return true;
  });

  const totalRepairs = statusCounts.reduce((sum, s) => sum + s.count, 0);

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
        {lastUpdated && (
          <Chip
            icon={<AccessTimeFilledRounded fontSize="small" />}
            label={`Last updated: ${formatLastUpdated()}`}
            size="small"
            variant="outlined"
            sx={{ color: 'text.secondary' }}
          />
        )}
        <Button
          onClick={() => fetchDashboardStats(true)}
          disabled={loading}
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <RefreshRounded />}
          sx={{ minWidth: '120px' }}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {error && !totalRepairs && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Could not load dashboard data: {error}. Click Refresh to try again.
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statusCards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <Box onClick={() => handleCardClick(card.status)} sx={{ cursor: 'pointer' }}>
              <StatCard
                title={card.title}
                value={card.count}
                icon={card.icon}
                color={card.color}
              />
            </Box>
          </Grid>
        ))}
      </Grid>

      {centerActiveStats.length > 0 && (
        <CenterActiveRepairs centers={centerActiveStats} />
      )}

      {centerBreakdown.length > 0 && (
        <ContentCard title="Devices Currently at Center" sx={{ mb: 4 }}>
          <Grid container spacing={2}>
            {centerBreakdown.map((center) => (
              <Grid item xs={6} sm={4} md={3} key={center.center_id}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: '#FAFBFC',
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <StoreIcon sx={{ color: 'primary.main' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {center.center_name}
                    </Typography>
                    <Typography variant="h6" fontWeight={700}>
                      {center.count}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
            {inTransitCount > 0 && (
              <Grid item xs={6} sm={4} md={3}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <ShippingIcon sx={{ color: '#F59E0B' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      In Transit
                    </Typography>
                    <Typography variant="h6" fontWeight={700}>
                      {inTransitCount}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>
        </ContentCard>
      )}

      <ContentCard title="Repairs Over Time" sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Click on a bar to see repairs from that day
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              type="date"
              label="From"
              size="small"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type="date"
              label="To"
              size="small"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleDateRangeSubmit}
              disabled={!startDate || !endDate}
            >
              Filter
            </Button>
          </Stack>
        </Box>

        <Box sx={{ height: 400 }}>
          {filteredChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredChartData} onClick={handleBarClick}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) =>
                    new Date(date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  }
                />
                <YAxis allowDecimals={false} />
                <RechartsTooltip
                  labelFormatter={(date) =>
                    new Date(date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  }
                />
                <Bar dataKey="count" fill="#EE6417" cursor="pointer" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography color="text.secondary">No repair data available for the selected period.</Typography>
            </Box>
          )}
        </Box>
      </ContentCard>
    </>
  );
}
