'use client';

import { useState, useEffect } from 'react';
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
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>(initialStatusCounts);
  const [dailyCounts, setDailyCounts] = useState<DailyCount[]>(initialDailyCounts);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [refreshCount, setRefreshCount] = useState(0);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      console.log(`Fetching dashboard stats (refresh #${refreshCount + 1})...`);
      
      // Use a cache-busting query parameter to ensure fresh data
      const response = await fetch(`/api/dashboard-stats?refresh=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }

      const data = await response.json();
      console.log('Received dashboard stats:', data);
      
      setStatusCounts(data.statusCounts);
      setDailyCounts(data.dailyCounts);
      setLastUpdated(data.timestamp || new Date().toISOString());
      setRefreshCount(prev => prev + 1);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Immediate fetch on component mount
    fetchDashboardStats();
    
    // Setup an interval to refresh data every 30 seconds
    const intervalId = setInterval(() => {
      fetchDashboardStats();
    }, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const statusCards = [
    {
      title: 'Active Repairs',
      count: statusCounts.find((s) => s.status === 'Received')?.count || 0,
      color: '#EE6417',
      status: 'Received',
    },
    {
      title: 'With Manufacturer',
      count:
        statusCounts.find((s) => s.status === 'Sent to Manufacturer')?.count || 0,
      color: '#3aa986',
      status: 'Sent to Manufacturer',
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
        <Tooltip title="Refresh dashboard stats">
          <IconButton 
            onClick={fetchDashboardStats} 
            disabled={loading}
            color="primary"
            sx={{ 
              bgcolor: loading ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
              '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.08)' }
            }}
          >
            {loading ? <CircularProgress size={24} /> : <RefreshRounded />}
          </IconButton>
        </Tooltip>
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