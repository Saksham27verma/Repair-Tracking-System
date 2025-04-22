'use client';

import { useState, useEffect, Suspense } from 'react';
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
  Chip,
  Paper,
  Card,
  CardContent,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  DateRange as DateRangeIcon,
  Refresh as RefreshIcon,
  FilterAlt as FilterIcon,
  CalendarToday as CalendarIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import {
  DataGrid,
  GridColDef,
  GridToolbar,
  GridValueGetterParams,
} from '@mui/x-data-grid';
import { supabase, getFreshSupabaseClient } from '@/lib/supabase';
import { RepairStatus } from '@/types/database';
import PageHeader from '@/app/components/PageHeader';
import LoadingSpinner from '@/app/components/LoadingSpinner';

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
  { 
    field: 'phone', 
    headerName: 'Phone', 
    width: 150,
    renderCell: (params) => (
      <Link 
        href={`tel:${params.value}`} 
        style={{ 
          color: 'inherit', 
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        {params.value}
        <PhoneIcon 
          fontSize="small" 
          sx={{ 
            ml: 0.5, 
            color: 'primary.main',
            display: { xs: 'inline-flex', md: 'none' }
          }} 
        />
      </Link>
    ),
  },
  { field: 'model_item_name', headerName: 'Product', width: 200 },
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
    field: 'estimate_status',
    headerName: 'Estimate Status',
    width: 150,
    renderCell: (params) => {
      if (!params.value || params.value === 'Not Required') return null;
      
      const statusColors: Record<string, string> = {
        'Pending': '#ff9800',
        'Approved': '#4caf50',
        'Declined': '#f44336',
      };
      
      const color = statusColors[params.value as string] || '#757575';
      
      return (
        <Chip
          label={params.value}
          size="small"
          sx={{
            backgroundColor: color + '20',
            color: color,
            fontWeight: 500,
          }}
        />
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
    field: 'warranty_after_repair',
    headerName: 'Repair Warranty',
    width: 150,
    valueGetter: (params: GridValueGetterParams) =>
      params.value || '-',
  },
  {
    field: 'receiving_center',
    headerName: 'Receiving Center',
    width: 150,
    valueGetter: (params: GridValueGetterParams) =>
      params.value || '-',
  },
  {
    field: 'customer_paid',
    headerName: 'Amount Paid',
    width: 130,
    valueFormatter: (params) =>
      params.value ? `₹${params.value}` : '-',
  },
];

function RepairsContent() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status');
  const dateParam = searchParams.get('date');
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');
  
  const [repairs, setRepairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(statusParam || 'all');
  const [dateFilter, setDateFilter] = useState<string>(dateParam || '');
  const [startDateFilter, setStartDateFilter] = useState<string>(startDateParam || '');
  const [endDateFilter, setEndDateFilter] = useState<string>(endDateParam || '');
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [showDateRange, setShowDateRange] = useState(false);

  const fetchRepairs = async () => {
    console.log('🔄 Fetching repairs with filters...');
    
    // Use a fresh client to avoid cache issues
    const freshClient = getFreshSupabaseClient();
    
    let query = freshClient.from('repairs').select('*');

    if (searchQuery) {
      query = query.or(
        `repair_id.ilike.%${searchQuery}%,patient_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,model_item_name.ilike.%${searchQuery}%`
      );
    }

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    // Single date filter
    if (dateFilter && !showDateRange) {
      // Filter by date - using the created_at column
      // We need to filter for the entire day, so we add time boundaries
      const startDate = new Date(dateFilter);
      const endDate = new Date(dateFilter);
      endDate.setHours(23, 59, 59, 999);
      
      query = query.gte('created_at', startDate.toISOString())
                   .lte('created_at', endDate.toISOString());
    }

    // Date range filter
    if (showDateRange && startDateFilter && endDateFilter) {
      const startDate = new Date(startDateFilter);
      // Set to beginning of day
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(endDateFilter);
      // Set to end of day
      endDate.setHours(23, 59, 59, 999);
      
      query = query.gte('created_at', startDate.toISOString())
                   .lte('created_at', endDate.toISOString());
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error fetching repairs:', error);
      return;
    }

    if (data) {
      console.log(`✅ Fetched ${data.length} repairs`);
      // Log some info about the first few records to help debugging
      if (data.length > 0) {
        const firstRecord = data[0];
        console.log('📊 First record:', {
          id: firstRecord.id,
          status: firstRecord.status,
          estimate_status: firstRecord.estimate_status,
          estimate_approval_date: firstRecord.estimate_approval_date,
        });
      }
    }

    setRepairs(data || []);
    setLoading(false);
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setDateFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    setSearchQuery('');
  };

  const toggleDateRangeFilter = () => {
    setShowDateRange(!showDateRange);
    if (showDateRange) {
      // Switching to single date, clear range fields
      setStartDateFilter('');
      setEndDateFilter('');
    } else {
      // Switching to range, clear single date field
      setDateFilter('');
    }
  };

  // Initialize the filters based on URL params
  useEffect(() => {
    if (statusParam) {
      setStatusFilter(statusParam);
    }
    if (dateParam) {
      setDateFilter(dateParam);
      setShowDateRange(false);
    }
    if (startDateParam && endDateParam) {
      setStartDateFilter(startDateParam);
      setEndDateFilter(endDateParam);
      setShowDateRange(true);
    }
  }, [statusParam, dateParam, startDateParam, endDateParam]);

  // Check if any filters are active
  useEffect(() => {
    setHasActiveFilters(
      statusFilter !== 'all' || 
      dateFilter !== '' || 
      startDateFilter !== '' || 
      endDateFilter !== '' || 
      searchQuery !== ''
    );
  }, [statusFilter, dateFilter, startDateFilter, endDateFilter, searchQuery]);

  // Fetch repairs on mount and when filters change
  useEffect(() => {
    fetchRepairs();
  }, [searchQuery, statusFilter, dateFilter, startDateFilter, endDateFilter, showDateRange]);

  // Format date for display
  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
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
          {dateFilter && !showDateRange && (
            <Typography component="span" variant="subtitle1" sx={{ ml: 1, fontWeight: 'normal', color: 'text.secondary' }}>
              from {formatDisplayDate(dateFilter)}
            </Typography>
          )}
          {showDateRange && startDateFilter && endDateFilter && (
            <Typography component="span" variant="subtitle1" sx={{ ml: 1, fontWeight: 'normal', color: 'text.secondary' }}>
              from {formatDisplayDate(startDateFilter)} to {formatDisplayDate(endDateFilter)}
            </Typography>
          )}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => fetchRepairs()}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            component={Link}
            href="/dashboard/repairs/new"
            variant="contained"
            startIcon={<AddIcon />}
          >
            New Repair
          </Button>
        </Box>
      </Box>

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
        
        <Grid item xs={12} sm={3} md={1}>
          <Button 
            variant="outlined" 
            size="small"
            onClick={toggleDateRangeFilter}
            startIcon={<DateRangeIcon />}
            sx={{ 
              height: '56px',
              width: '100%',
              borderColor: showDateRange ? 'primary.main' : 'divider',
              color: showDateRange ? 'primary.main' : 'text.secondary',
            }}
          >
            {showDateRange ? 'Single' : 'Range'}
          </Button>
        </Grid>
        
        <Grid item xs={12} sm={9} md={showDateRange ? 3 : 2}>
          {!showDateRange ? (
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
          ) : (
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Start Date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  sx={{ height: '56px' }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="End Date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  sx={{ height: '56px' }}
                />
              </Grid>
            </Grid>
          )}
        </Grid>
        
        {hasActiveFilters && (
          <Grid item xs={12} sm={12} md={showDateRange ? 2 : 3}>
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

      <Box 
        sx={{ 
          height: { xs: 'calc(100vh - 300px)', md: 'calc(100vh - 250px)' }, 
          width: '100%',
          maxWidth: '100vw',
          // These styles ensure the container itself allows scrolling
          overflow: 'hidden',
          '& .MuiDataGrid-root': {
            // Make the DataGrid scrollable
            overflow: 'visible',
            width: '100%',
          },
        }}
      >
        {/* Add a scrollable wrapper div that ensures horizontal scrolling works on all devices */}
        <div style={{ 
          width: '100%', 
          height: '100%', 
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch', // For improved scrolling on iOS
        }}>
          <div style={{ 
            minWidth: '1000px', // Set minimum width to ensure horizontal scrolling is activated
            height: '100%' 
          }}>
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
              sx={{
                // Styles for the DataGrid
                width: '100%',
                height: '100%',
                '& .MuiDataGrid-cell': {
                  overflow: 'visible',
                  whiteSpace: 'normal',
                  minWidth: '100px',
                  textOverflow: 'ellipsis',
                },
                '& .MuiDataGrid-columnHeader': {
                  minWidth: '100px',
                  whiteSpace: 'normal',
                  lineHeight: '1.2',
                },
                '& ::-webkit-scrollbar': {
                  height: '8px',
                  width: '8px',
                },
                '& ::-webkit-scrollbar-thumb': {
                  backgroundColor: '#bdbdbd',
                  borderRadius: '4px',
                },
              }}
            />
          </div>
        </div>
      </Box>
    </Box>
  );
}

export default function RepairsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <RepairsContent />
    </Suspense>
  );
} 