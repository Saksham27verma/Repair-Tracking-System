'use client';

import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DashboardChartsProps {
  statusCounts: any[];
  dailyCounts: any[];
}

export default function DashboardCharts({ statusCounts, dailyCounts }: DashboardChartsProps) {
  const router = useRouter();

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

  return (
    <>
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
        <Typography variant="h6" gutterBottom>
          Repairs Over Time
          <Typography component="span" variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
            (Click on a bar to see repairs from that day)
          </Typography>
        </Typography>
        <Box sx={{ height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={dailyCounts}
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
              <Tooltip
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