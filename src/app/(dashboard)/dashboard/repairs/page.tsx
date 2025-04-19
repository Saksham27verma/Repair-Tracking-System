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
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import {
  DataGrid,
  GridColDef,
  GridToolbar,
  GridValueGetterParams,
} from '@mui/x-data-grid';
import { supabase } from '@/lib/supabase';
import { RepairStatus } from '@/types/database';
import { format } from 'date-fns';

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
  const dateParam = searchParams.get('date');
  
  const [repairs, setRepairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(statusParam || 'all');
  const [dateFilter, setDateFilter] = useState<string>(dateParam || '');
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

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

    if (dateFilter) {
      // Filter by date - using the created_at column
      // We need to filter for the entire day, so we add time boundaries
      const startDate = new Date(dateFilter);
      const endDate = new Date(dateFilter);
      endDate.setHours(23, 59, 59, 999);
      
      query = query.gte('created_at', startDate.toISOString())
                   .lte('created_at', endDate.toISOString());
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

  const clearFilters = () => {
    setStatusFilter('all');
    setDateFilter('');
    setSearchQuery('');
  };

  // Initialize the filters based on URL params
  useEffect(() => {
    if (statusParam) {
      setStatusFilter(statusParam);
    }
    if (dateParam) {
      setDateFilter(dateParam);
    }
  }, [statusParam, dateParam]);

  // Check if any filters are active
  useEffect(() => {
    setHasActiveFilters(statusFilter !== 'all' || dateFilter !== '' || searchQuery !== '');
  }, [statusFilter, dateFilter, searchQuery]);

  // Fetch repairs on mount and when filters change
  useEffect(() => {
    fetchRepairs();
  }, [searchQuery, statusFilter, dateFilter]);

  // Format date for display
  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

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
        <Typography variant="h4">
          Repairs
          {dateFilter && (
            <Typography component="span" variant="subtitle1" sx={{ ml: 1, fontWeight: 'normal', color: 'text.secondary' }}>
              from {formatDisplayDate(dateFilter)}
            </Typography>
          )}
        </Typography>
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
        <Grid item xs={12} sm={6} md={3}>
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
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton 
                    size="small"
                    onClick={() => setSearchQuery('')}
                    edge="end"
                    aria-label="clear search"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
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
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            type="date"
            label="Filter by Date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              endAdornment: dateFilter ? (
                <InputAdornment position="end">
                  <IconButton 
                    size="small"
                    onClick={() => setDateFilter('')}
                    edge="end"
                    aria-label="clear date"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
        </Grid>
        {hasActiveFilters && (
          <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={clearFilters}
              startIcon={<ClearIcon />}
              fullWidth
              sx={{ height: '56px' }}
            >
              Clear Filters
            </Button>
          </Grid>
        )}
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