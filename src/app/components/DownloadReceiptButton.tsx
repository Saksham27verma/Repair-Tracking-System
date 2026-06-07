'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import { PictureAsPdf as PdfIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';

interface DownloadReceiptButtonProps {
  repairId: string;
  repairTrackingId: string;
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  autoDownload?: boolean;
}

export default function DownloadReceiptButton({
  repairId,
  repairTrackingId,
  variant = 'outlined',
  size = 'small',
  autoDownload = false,
}: DownloadReceiptButtonProps) {
  const [loading, setLoading] = useState(false);
  const hasAutoDownloaded = useRef(false);

  const downloadReceipt = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/repairs/${repairId}/receipt`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to generate receipt');
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
      link.download = `drop-off-receipt-${repairTrackingId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Receipt downloaded successfully');
    } catch (error) {
      console.error('Receipt download failed:', error);
      toast.error('Could not download receipt. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [repairId, repairTrackingId]);

  useEffect(() => {
    if (autoDownload && !hasAutoDownloaded.current) {
      hasAutoDownloaded.current = true;
      toast.success('Repair created. Downloading drop-off receipt…');
      downloadReceipt();
    }
  }, [autoDownload, downloadReceipt]);

  return (
    <Button
      variant={variant}
      size={size}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <PdfIcon />}
      onClick={downloadReceipt}
      disabled={loading}
    >
      {loading ? 'Generating…' : 'Download Receipt'}
    </Button>
  );
}
