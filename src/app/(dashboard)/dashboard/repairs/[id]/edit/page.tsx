'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Alert, Box, Button } from '@mui/material';
import { supabase } from '@/lib/supabase';
import { RepairRecord } from '@/app/types/database';
import PageShell from '@/app/components/ui/PageShell';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import RepairForm from '../../_components/RepairForm';

function EditRepairPageInner() {
  const params = useParams();
  const repairId = params.id as string;
  const [repair, setRepair] = useState<RepairRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadRepair() {
      setLoading(true);
      setNotFound(false);

      const { data, error } = await supabase
        .from('repairs')
        .select('*')
        .eq('id', repairId)
        .single();

      if (cancelled) return;

      if (error || !data) {
        console.error('Failed to load repair for edit:', error);
        setRepair(null);
        setNotFound(true);
      } else {
        setRepair(data);
      }

      setLoading(false);
    }

    loadRepair();

    return () => {
      cancelled = true;
    };
  }, [repairId]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (notFound || !repair) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <Alert severity="warning" sx={{ mb: 3, textAlign: 'left' }}>
          This repair could not be found. It may have been deleted or the link is incorrect.
        </Alert>
        <Button component={Link} href="/dashboard/repairs" variant="contained">
          Back to Repairs
        </Button>
      </Box>
    );
  }

  return (
    <PageShell
      title="Edit Repair"
      subtitle={`Repair ID: ${repair.repair_id}`}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Repairs', href: '/dashboard/repairs' },
        { label: repair.repair_id, href: `/dashboard/repairs/${repair.id}` },
        { label: 'Edit' },
      ]}
    >
      <RepairForm repair={repair} mode="edit" />
    </PageShell>
  );
}

export default function EditRepairPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <EditRepairPageInner />
    </Suspense>
  );
}
