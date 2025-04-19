'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  Button,
  Typography,
  TextField,
  MenuItem,
  Grid,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import {
  DataGrid,
  GridColDef,
  GridToolbar,
  GridValueGetterParams,
} from '@mui/x-data-grid';
import { supabase } from '@/lib/supabase';
import { RepairStatus } from '@/types/database';

const columns: GridColDef[] = [
  {
    field: 'repair_id',
    headerName: 'Repair ID',
    width: 150,
    renderCell: (params) => (
      <Link href={`/dashboard/repairs/${params.row.id}`} style={{ color: '#EE6417' }}>
        {params.value}
      </Link>
    ),
  },
  { field: 'patient_name', headerName: 'Patient Name', width: 200 },
  { field: 'phone', headerName: 'Phone', width: 150 },
  { field: 'product_name', headerName: 'Product', width: 200 },
  {
    field: 'status',
    headerName: 'Status',
    width: 200,
    renderCell: (params) => {
      const statusColors: Record<RepairStatus, string> = {
        'Received': '#EE6417',
        'Sent to Manufacturer': '#ff9800',
        'Returned from Manufacturer': '#2196f3',
        'Ready for Pickup': '#3aa986',
        'Completed': '#4caf50',
      };
      return (
        <Box
          sx={{
            backgroundColor: statusColors[params.value as RepairStatus] + '20',
            color: statusColors[params.value as RepairStatus],
            py: 1,
            px: 2,
            borderRadius: 2,
            fontWeight: 500,
          }}
        >
          {params.value}
        </Box>
      );
    },
  },
  {
    field: 'date_of_receipt',
    headerName: 'Received Date',
    width: 150,
    valueGetter: (params: GridValueGetterParams) =>
      new Date(params.value).toLocaleDateString('en-US'),
  },
  {
    field: 'warranty',
    headerName: 'Warranty',
    width: 150,
  },
  {
    field: 'customer_paid',
    headerName: 'Amount Paid',
    width: 130,
    valueFormatter: (params) =>
      params.value ? `₹${params.value.toFixed(2)}` : '-',
  },
];

export default function RepairsPage() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status');
  
  const [repairs, setRepairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(statusParam || 'all');

  const fetchRepairs = async () => {
    let query = supabase.from('repairs').select('*');

    if (searchQuery) {
      query = query.or(
        `repair_id.ilike.%${searchQuery}%,patient_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,product_name.ilike.%${searchQuery}%`
      );
    }

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching repairs:', error);
      return;
    }

    setRepairs(data || []);
    setLoading(false);
  };

  // Initialize the filter based on URL params
  useEffect(() => {
    if (statusParam) {
      setStatusFilter(statusParam);
    }
  }, [statusParam]);

  // Fetch repairs on mount and when filters change
  useEffect(() => {
    fetchRepairs();
  }, [searchQuery, statusFilter]);

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Typography variant="h4">Repairs</Typography>
        <Button
          component={Link}
          href="/dashboard/repairs/new"
          variant="contained"
          startIcon={<AddIcon />}
        >
          New Repair
        </Button>
      </Box>

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            placeholder="Search repairs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            select
            fullWidth
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Filter by Status"
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="Received">Received</MenuItem>
            <MenuItem value="Sent to Manufacturer">Sent to Manufacturer</MenuItem>
            <MenuItem value="Returned from Manufacturer">
              Returned from Manufacturer
            </MenuItem>
            <MenuItem value="Ready for Pickup">Ready for Pickup</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      <Box sx={{ height: 'calc(100vh - 250px)', width: '100%' }}>
        <DataGrid
          rows={repairs}
          columns={columns}
          loading={loading}
          components={{
            Toolbar: GridToolbar,
          }}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25, page: 0 },
            },
            sorting: {
              sortModel: [{ field: 'date_of_receipt', sort: 'desc' }],
            },
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          disableRowSelectionOnClick
          getRowId={(row) => row.id}
        />
      </Box>
    </Box>
  );
} 