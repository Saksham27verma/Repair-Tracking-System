'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import { Receipt as InvoiceIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';

interface DownloadInvoiceButtonProps {
  repairId: string;
  invoiceNumber: string;
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  autoDownload?: boolean;
}

export default function DownloadInvoiceButton({
  repairId,
  invoiceNumber,
  variant = 'outlined',
  size = 'small',
  autoDownload = false,
}: DownloadInvoiceButtonProps) {
  const [loading, setLoading] = useState(false);
  const hasAutoDownloaded = useRef(false);

  const downloadInvoice = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/repairs/${repairId}/invoice`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to generate invoice');
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/pdf')) {
        throw new Error('Server did not return a PDF file');
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Received an empty PDF file');
      }
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tax-invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Invoice download failed:', error);
      toast.error('Could not download invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [repairId, invoiceNumber]);

  useEffect(() => {
    if (autoDownload && invoiceNumber && !hasAutoDownloaded.current) {
      hasAutoDownloaded.current = true;
      toast.success('Invoice created. Downloading tax invoice…');
      downloadInvoice();
    }
  }, [autoDownload, invoiceNumber, downloadInvoice]);

  return (
    <Button
      variant={variant}
      size={size}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <InvoiceIcon />}
      onClick={downloadInvoice}
      disabled={loading}
    >
      {loading ? 'Generating…' : 'Download Invoice'}
    </Button>
  );
}
