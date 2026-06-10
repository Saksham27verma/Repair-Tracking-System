'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Download as DownloadIcon,
  OpenInNew as PreviewIcon,
  Receipt as InvoiceIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import toast from 'react-hot-toast';
import PageShell from '@/app/components/ui/PageShell';
import { formatCurrency } from '@/lib/invoice-tax';
import type { CustomerTaxInvoice } from '@/app/types/database';
import { getFreshSupabaseClient } from '@/lib/supabase';

interface InvoiceRow extends CustomerTaxInvoice {
  patient_name: string;
  phone: string;
  repair_tracking_id: string;
  model_item_name: string;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function InvoicesPage() {
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getFreshSupabaseClient();
      const { data, error } = await supabase
        .from('customer_tax_invoices')
        .select(`
          *,
          repair:repairs(id, repair_id, patient_name, phone, model_item_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: InvoiceRow[] = (data ?? []).map((inv) => {
        const repair = Array.isArray(inv.repair) ? inv.repair[0] : inv.repair;
        return {
          ...inv,
          patient_name: repair?.patient_name ?? '—',
          phone: repair?.phone ?? '—',
          repair_tracking_id: repair?.repair_id ?? '—',
          model_item_name: repair?.model_item_name ?? '—',
        };
      });

      setRows(mapped);
    } catch (err) {
      toast.error('Failed to load invoices');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const downloadPdf = async (repairId: string, invoiceNumber: string) => {
    setDownloading(invoiceNumber);
    try {
      const res = await fetch(`/api/repairs/${repairId}/invoice`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to generate PDF');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tax-invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded');
    } catch {
      toast.error('Could not download invoice');
    } finally {
      setDownloading(null);
    }
  };

  const filtered = search.trim()
    ? rows.filter((r) => {
        const q = search.toLowerCase();
        return (
          r.invoice_number.toLowerCase().includes(q) ||
          r.patient_name.toLowerCase().includes(q) ||
          r.repair_tracking_id.toLowerCase().includes(q) ||
          r.phone.includes(q) ||
          r.model_item_name.toLowerCase().includes(q)
        );
      })
    : rows;

  const columns: GridColDef[] = [
    {
      field: 'invoice_number',
      headerName: 'Invoice No.',
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={700} color="primary.main">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'invoice_date',
      headerName: 'Date',
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2">{formatDate(params.value)}</Typography>
      ),
    },
    {
      field: 'patient_name',
      headerName: 'Patient',
      width: 180,
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 130,
    },
    {
      field: 'repair_tracking_id',
      headerName: 'Repair ID',
      width: 150,
      renderCell: (params) => (
        <Link
          href={`/dashboard/repairs/${params.row.repair_id}`}
          style={{ color: '#EE6417', textDecoration: 'none', fontWeight: 600 }}
        >
          {params.value}
        </Link>
      ),
    },
    {
      field: 'model_item_name',
      headerName: 'Device',
      width: 200,
    },
    {
      field: 'gross_amount',
      headerName: 'Amount',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={700}>
          {formatCurrency(params.value)}
        </Typography>
      ),
    },
    {
      field: 'gst_rate',
      headerName: 'GST',
      width: 80,
      renderCell: (params) => (
        <Chip label={`${params.value}%`} size="small" variant="outlined" />
      ),
    },
    {
      field: 'net_amount',
      headerName: 'Taxable',
      width: 110,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {formatCurrency(params.value)}
        </Typography>
      ),
    },
    {
      field: 'cgst_amount',
      headerName: 'CGST',
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {formatCurrency(params.value)}
        </Typography>
      ),
    },
    {
      field: 'sgst_amount',
      headerName: 'SGST',
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {formatCurrency(params.value)}
        </Typography>
      ),
    },
    {
      field: 'payment_mode',
      headerName: 'Payment',
      width: 120,
      renderCell: (params) =>
        params.value ? (
          <Chip label={params.value} size="small" />
        ) : (
          <Typography variant="body2" color="text.disabled">—</Typography>
        ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 110,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Download PDF">
            <span>
              <IconButton
                size="small"
                color="primary"
                disabled={downloading === params.row.invoice_number}
                onClick={() => downloadPdf(params.row.repair_id, params.row.invoice_number)}
              >
                <DownloadIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Preview HTML">
            <IconButton
              size="small"
              component="a"
              href={`/api/repairs/${params.row.repair_id}/invoice?format=html`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <PreviewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  const totalAmount = filtered.reduce((sum, r) => sum + (r.gross_amount || 0), 0);

  return (
    <PageShell
      title="Tax Invoices"
      subtitle="All customer tax invoices issued from repairs"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Tax Invoices' },
      ]}
      actions={
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={load}
          disabled={loading}
        >
          Refresh
        </Button>
      }
    >
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search by invoice #, patient, repair ID, device…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 360 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearch('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />

        <Stack direction="row" spacing={2} sx={{ ml: 'auto' }}>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">
              {filtered.length} invoice{filtered.length !== 1 ? 's' : ''}
            </Typography>
            <Typography variant="body2" fontWeight={700} color="primary.main">
              Total: {formatCurrency(totalAmount)}
            </Typography>
          </Box>
        </Stack>
      </Box>

      {!loading && filtered.length === 0 && !search && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: 8,
            gap: 2,
            color: 'text.secondary',
          }}
        >
          <InvoiceIcon sx={{ fontSize: 56, opacity: 0.3 }} />
          <Typography variant="h6" color="text.secondary">
            No invoices yet
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Create a tax invoice from a repair detail page to see it here.
          </Typography>
        </Box>
      )}

      {(loading || filtered.length > 0 || search) && (
        <DataGrid
          rows={filtered}
          columns={columns}
          loading={loading}
          autoHeight
          pageSizeOptions={[25, 50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          disableRowSelectionOnClick
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            '& .MuiDataGrid-columnHeader': {
              bgcolor: '#FAFBFC',
              fontWeight: 700,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            },
            '& .MuiDataGrid-row:hover': { bgcolor: 'rgba(238, 100, 23, 0.04)' },
          }}
        />
      )}
    </PageShell>
  );
}
