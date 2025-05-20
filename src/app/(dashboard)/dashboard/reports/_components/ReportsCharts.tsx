'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Box,
  Paper,
  Typography,
  Grid,
} from '@mui/material';

type RepairsByStatus = {
  name: string;
  value: number;
};

type RepairsByWarranty = {
  name: string;
  value: number;
};

interface ReportsChartsProps {
  repairsByStatus: RepairsByStatus[];
  repairsByWarranty: RepairsByWarranty[];
  totalRevenue: number;
  totalProfit: number;
}

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value, name }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
    >
      {`${value}`}
    </text>
  );
};

export default function ReportsCharts({ 
  repairsByStatus, 
  repairsByWarranty, 
  totalRevenue,
  totalProfit 
}: ReportsChartsProps) {
  const COLORS = ['#EE6417', '#3aa986', '#2196f3', '#f44336', '#9c27b0'];

  // Debug information
  console.log('Status Data:', repairsByStatus);
  console.log('Warranty Data:', repairsByWarranty);
  console.log('Total Revenue:', totalRevenue);

  // Check if we have data
  const hasStatusData = repairsByStatus && repairsByStatus.length > 0;
  const hasWarrantyData = repairsByWarranty && repairsByWarranty.length > 0;

  if (!hasStatusData && !hasWarrantyData) {
    return (
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Repairs by Status
              </Typography>
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">
                  No repair data available
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Repairs by Warranty Status
              </Typography>
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">
                  No warranty data available
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Total Revenue
              </Typography>
              <Typography variant="h3" color="success.main">
                ₹{totalRevenue.toLocaleString()}
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Generated from Repairs
              </Typography>
              <Typography variant="h3" color="success.main">
                ₹{totalProfit.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                (Cash Received - Company Billing to Hope)
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Repairs by Status
            </Typography>
            <Box sx={{ height: 350, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {hasStatusData && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={repairsByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={renderCustomizedLabel}
                    >
                      {repairsByStatus.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} repairs`, name]} />
                    <Legend 
                      layout="vertical" 
                      align="right"
                      verticalAlign="middle"
                      formatter={(value, entry) => {
                        const { payload } = entry as any;
                        return `${value}: ${payload.value} repairs`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Repairs by Warranty Status
            </Typography>
            <Box sx={{ height: 350, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {hasWarrantyData && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={repairsByWarranty}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={renderCustomizedLabel}
                    >
                      {repairsByWarranty.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} repairs`, name]} />
                    <Legend 
                      layout="vertical" 
                      align="right"
                      verticalAlign="middle"
                      formatter={(value, entry) => {
                        const { payload } = entry as any;
                        return `${value}: ${payload.value} repairs`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Total Revenue
            </Typography>
            <Typography variant="h3" color="success.main">
              ₹{totalRevenue.toLocaleString()}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Generated from Repairs
            </Typography>
            <Typography variant="h3" color="success.main">
              ₹{totalProfit.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              (Cash Received - Company Billing to Hope)
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 