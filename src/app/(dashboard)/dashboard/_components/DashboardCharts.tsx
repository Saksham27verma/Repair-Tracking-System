'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Stack,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip,
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
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RefreshRounded, AccessTimeFilledRounded } from '@mui/icons-material';
import { useAlert } from '@/app/components/AlertProvider';

interface StatusCount {
  status: string;
  count: number;
}

interface DailyCount {
  date: string;
  count: number;
}

interface DashboardChartsProps {
  initialStatusCounts: StatusCount[];
  initialDailyCounts: DailyCount[];
}

export default function DashboardCharts({ 
  initialStatusCounts = [], 
  initialDailyCounts = [] 
}: DashboardChartsProps) {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>(initialStatusCounts);
  const [dailyCounts, setDailyCounts] = useState<DailyCount[]>(initialDailyCounts);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());
  const [refreshCount, setRefreshCount] = useState(0);
  
  // Use refs to prevent duplicate fetches
  const initialFetchDone = useRef(false);
  const isFetchingRef = useRef(false);
  const mountedRef = useRef(false);

  // Memoize the fetchDashboardStats function with stricter guards
  const fetchDashboardStats = useCallback(async (showSuccessMessage = false) => {
    // Prevent concurrent fetches and respect loading state
    if (isFetchingRef.current || loading) {
      console.log('Fetch already in progress, skipping...');
      return;
    }

    // Mark fetch as in progress
    isFetchingRef.current = true;
    setLoading(true);
    
    try {
      console.log(`Manually fetching dashboard stats (refresh #${refreshCount + 1})...`);
      
      // Use stronger cache-busting method by adding unique timestamp to URL
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/dashboard-stats?refresh=${timestamp}&nocache=${Math.random()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store',
        next: { revalidate: 0 }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard stats: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Received dashboard stats from manual refresh');
      
      // Only update state if component is still mounted
      if (mountedRef.current) {
        // Force a state update even if data looks the same
        setStatusCounts([...data.statusCounts]);
        setDailyCounts([...data.dailyCounts]);
        setLastUpdated(data.timestamp || new Date().toISOString());
        setRefreshCount(prev => prev + 1);
        
        if (showSuccessMessage) {
          showAlert('Dashboard refreshed successfully', 'success');
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      if (mountedRef.current) {
        showAlert('Failed to refresh dashboard data. Please try again.', 'error');
      }
    } finally {
      // Reset flags if component is still mounted
      if (mountedRef.current) {
        setLoading(false);
      }
      isFetchingRef.current = false;
    }
  }, [refreshCount, showAlert, loading]);

  // Handle manual refresh button click - the ONLY way to refresh
  const handleRefreshClick = useCallback(() => {
    if (!loading && !isFetchingRef.current) {
      fetchDashboardStats(true); // Show success message on manual refresh
    }
  }, [fetchDashboardStats, loading]);

  useEffect(() => {
    // Set mounted flag
    mountedRef.current = true;
    
    // Initial data fetch (ONLY once)
    if (!initialFetchDone.current && !isFetchingRef.current) {
      initialFetchDone.current = true;
      
      // If we have initial data from server, don't fetch again
      if (initialStatusCounts.length > 0 || initialDailyCounts.length > 0) {
        console.log('Using server-provided initial data instead of fetching');
        setLastUpdated(new Date().toISOString());
      } else {
        console.log('No initial data, performing one-time fetch');
        fetchDashboardStats();
      }
    }
    
    // Cleanup
    return () => {
      console.log('Dashboard component unmounted - cleaning up');
      mountedRef.current = false;
    };
  }, []); // Empty dependency array - run ONLY once on mount

  const statusCards = [
    {
      title: 'Active Repairs',
      count: statusCounts.find((s) => s.status === 'Received')?.count || 0,
      color: '#EE6417',
      status: 'Received',
    },
    {
      title: 'With Company',
      count:
        statusCounts.find((s) => s.status === 'Sent to Company for Repair')?.count || 0,
      color: '#3aa986',
      status: 'Sent to Company for Repair',
    },
    {
      title: 'Ready for Pickup',
      count:
        statusCounts.find((s) => s.status === 'Ready for Pickup')?.count || 0,
      color: '#2196f3',
      status: 'Ready for Pickup',
    },
    {
      title: 'Completed',
      count: statusCounts.find((s) => s.status === 'Completed')?.count || 0,
      color: '#4caf50',
      status: 'Completed',
    },
  ];

  // Format the last updated time nicely
  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    try {
      const date = new Date(lastUpdated);
      return date.toLocaleTimeString();
    } catch (error) {
      return '';
    }
  };

  const handleCardClick = (status: string) => {
    router.push(`/dashboard/repairs?status=${encodeURIComponent(status)}`);
  };

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const clickedDate = data.activePayload[0].payload.date;
      // Format date for URL: YYYY-MM-DD
      router.push(`/dashboard/repairs?date=${clickedDate}`);
    }
  };

  const handleDateRangeSubmit = () => {
    if (startDate && endDate) {
      router.push(`/dashboard/repairs?startDate=${startDate}&endDate=${endDate}`);
    }
  };

  // Filter chart data if date range is set
  const filteredChartData = dailyCounts.filter(item => {
    if (!startDate && !endDate) return true;
    
    const itemDate = new Date(item.date);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    if (start && end) {
      return itemDate >= start && itemDate <= end;
    } else if (start) {
      return itemDate >= start;
    } else if (end) {
      return itemDate <= end;
    }
    return true;
  });

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
        {/* Use a regular button instead of IconButton for better visibility */}
        <Button
          onClick={handleRefreshClick}
          disabled={loading}
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <RefreshRounded />}
          sx={{ minWidth: '120px' }}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statusCards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
                  '& .card-title': {
                    color: card.color,
                  },
                },
              }}
              onClick={() => handleCardClick(card.status)}
            >
              <CardContent>
                <Typography 
                  className="card-title"
                  color="text.secondary" 
                  gutterBottom
                  sx={{ 
                    fontWeight: 500,
                    transition: 'color 0.2s ease-in-out',
                  }}
                >
                  {card.title}
                </Typography>
                <Typography
                  variant="h4"
                  component="div"
                  sx={{ color: card.color }}
                >
                  {card.count}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper 
        sx={{ 
          p: 3, 
          mb: 4,
          '&:hover': {
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08)',
          },
          transition: 'box-shadow 0.3s ease-in-out',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Repairs Over Time
              <Typography component="span" variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
                (Click on a bar to see repairs from that day)
              </Typography>
            </Typography>
          </Box>
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
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={filteredChartData}
              onClick={handleBarClick}
            >
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
              <YAxis />
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
              <Bar 
                dataKey="count" 
                fill="#EE6417" 
                cursor="pointer"
                className="clickable-bar"
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </>
  );
} 