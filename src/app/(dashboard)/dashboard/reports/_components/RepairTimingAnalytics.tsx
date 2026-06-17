'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Box,
  Grid,
  Paper,
  Typography,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridToolbar,
} from '@mui/x-data-grid';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { RepairStatus } from '@/app/types/database';
import {
  RepairTimingRow,
  TIMED_STAGES,
  computeStageAggregates,
  formatDurationDays,
  formatDurationMs,
  getStageDuration,
} from '@/lib/repair-timing';

interface RepairTimingAnalyticsProps {
  rows: RepairTimingRow[];
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

const CHART_COLORS = ['#EE6417', '#2196f3', '#3aa986', '#9c27b0'];

function SummaryCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h4" fontWeight={700} color="primary.main">
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Paper>
  );
}

export default function RepairTimingAnalytics({
  rows,
  statusFilter,
  onStatusFilterChange,
}: RepairTimingAnalyticsProps) {
  const completedRows = rows.filter((row) => row.timing.isComplete);
  const aggregates = useMemo(() => computeStageAggregates(rows.map((row) => row.timing)), [rows]);

  const chartData = aggregates
    .filter((item) => item.sampleCount > 0)
    .map((item) => ({
      name: item.label,
      averageDays: Number((item.averageMs / (1000 * 60 * 60 * 24)).toFixed(1)),
      minDays: Number((item.minMs / (1000 * 60 * 60 * 24)).toFixed(1)),
      maxDays: Number((item.maxMs / (1000 * 60 * 60 * 24)).toFixed(1)),
    }));

  const averageTotalMs =
    completedRows.length > 0
      ? Math.round(
          completedRows.reduce((sum, row) => sum + (row.timing.totalDurationMs ?? 0), 0) /
            completedRows.length
        )
      : null;

  const manufacturerAggregate = aggregates.find(
    (item) => item.status === 'Sent to Company for Repair'
  );

  const columns: GridColDef[] = [
    {
      field: 'repairId',
      headerName: 'Repair ID',
      width: 130,
      renderCell: (params) => (
        <Link
          href={`/dashboard/repairs/${params.row.id}`}
          style={{ color: 'inherit', fontWeight: 600, textDecoration: 'none' }}
        >
          {params.value}
        </Link>
      ),
    },
    { field: 'patientName', headerName: 'Patient', width: 180 },
    { field: 'receivingCenter', headerName: 'Center', width: 130 },
    { field: 'status', headerName: 'Status', width: 190 },
    {
      field: 'totalDuration',
      headerName: 'Total Time',
      width: 120,
      valueGetter: (params) => params.row.timing.totalDurationMs ?? 0,
      renderCell: (params) => formatDurationDays(params.row.timing.totalDurationMs),
    },
    ...TIMED_STAGES.map(
      (status): GridColDef => ({
        field: status,
        headerName:
          status === 'Sent to Company for Repair'
            ? 'At Mfr'
            : status === 'Returned from Manufacturer'
              ? 'Returned'
              : status === 'Ready for Pickup'
                ? 'Pickup Wait'
                : 'Received',
        width: 110,
        valueGetter: (params) => getStageDuration(params.row.timing, status) ?? 0,
        renderCell: (params) =>
          formatDurationMs(getStageDuration(params.row.timing, status)),
      })
    ),
  ];

  const gridRows = rows.map((row) => ({
    ...row,
    id: row.id,
  }));

  return (
    <Box sx={{ mt: 4 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Repair Time Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total repair duration and time spent in each workflow stage
          </Typography>
        </Box>
        <TextField
          select
          size="small"
          label="Status filter"
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value)}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="all">All repairs</MenuItem>
          <MenuItem value="completed">Completed only</MenuItem>
          <MenuItem value="in_progress">In progress only</MenuItem>
          {(
            [
              'Received',
              'Sent to Company for Repair',
              'Returned from Manufacturer',
              'Ready for Pickup',
              'Completed',
            ] as RepairStatus[]
          ).map((status) => (
            <MenuItem key={status} value={status}>
              {status}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <SummaryCard
            title="Avg. total repair time"
            value={formatDurationDays(averageTotalMs)}
            subtitle={`${completedRows.length} completed repair${completedRows.length === 1 ? '' : 's'}`}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <SummaryCard
            title="Avg. time at manufacturer"
            value={formatDurationDays(manufacturerAggregate?.averageMs)}
            subtitle={`${manufacturerAggregate?.sampleCount ?? 0} repairs with manufacturer stage`}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <SummaryCard
            title="Repairs in report"
            value={`${rows.length}`}
            subtitle="Based on receipt and movement dates"
          />
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Average Time per Stage
        </Typography>
        {chartData.length > 0 ? (
          <Box sx={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value} days`,
                    name === 'averageDays' ? 'Average' : name === 'minDays' ? 'Minimum' : 'Maximum',
                  ]}
                />
                <Legend />
                <Bar dataKey="averageDays" name="Average" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="minDays" name="Minimum" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="maxDays" name="Maximum" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        ) : (
          <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
            No stage timing data available yet
          </Typography>
        )}
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ px: 1, pt: 1, pb: 2 }}>
          Repair Timing Report
        </Typography>
        <Box sx={{ height: 520, width: '100%' }}>
          <DataGrid
            rows={gridRows}
            columns={columns}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
              sorting: { sortModel: [{ field: 'totalDuration', sort: 'desc' }] },
            }}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 300 },
              },
            }}
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: 'action.hover',
              },
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
}
