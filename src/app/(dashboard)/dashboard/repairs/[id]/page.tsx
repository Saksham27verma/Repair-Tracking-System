'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import RepairDetailPageContent from '../_components/RepairDetailPageContent';

function RepairDetailPageInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const repairId = params.id as string;
  const autoDownloadReceipt = searchParams.get('receipt') === '1';

  return (
    <RepairDetailPageContent
      repairId={repairId}
      autoDownloadReceipt={autoDownloadReceipt}
    />
  );
}

export default function RepairDetailPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <RepairDetailPageInner />
    </Suspense>
  );
}
