'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button, CircularProgress } from '@mui/material';
import { PictureAsPdf as PdfIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';

function receiptAutoDownloadKey(repairId: string) {
  return `receipt-auto-downloaded:${repairId}`;
}

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
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const hasAutoDownloaded = useRef(false);

  const clearReceiptQueryParam = useCallback(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has('receipt')) return;
    params.delete('receipt');
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [pathname, router]);

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
    if (!autoDownload) return;

    const storageKey = receiptAutoDownloadKey(repairId);
    if (typeof window !== 'undefined' && sessionStorage.getItem(storageKey)) {
      clearReceiptQueryParam();
      return;
    }

    if (hasAutoDownloaded.current) return;
    hasAutoDownloaded.current = true;

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(storageKey, '1');
    }

    clearReceiptQueryParam();
    toast.success('Repair created. Downloading drop-off receipt…');
    downloadReceipt();
  }, [autoDownload, clearReceiptQueryParam, downloadReceipt, repairId]);

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
