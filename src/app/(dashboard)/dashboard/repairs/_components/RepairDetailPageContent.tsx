'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Box, Button } from '@mui/material';
import { supabase } from '@/lib/supabase';
import { EstimateStatus, RepairRecord } from '@/app/types/database';
import PageShell from '@/app/components/ui/PageShell';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import RepairDetailView from './RepairDetailView';
import RepairDetailActions from './RepairDetailActions';

type RepairWithRelations = RepairRecord & {
  current_center?: { id: string; name: string };
  pickup_center?: { id: string; name: string };
  customer_tax_invoice?: RepairRecord['customer_tax_invoice'];
};

async function fetchRepair(id: string): Promise<RepairWithRelations | null> {
  const { data: repair, error } = await supabase
    .from('repairs')
    .select(`
      *,
      current_center:centers!repairs_current_center_id_fkey(id, name),
      pickup_center:centers!repairs_pickup_center_id_fkey(id, name)
    `)
    .eq('id', id)
    .single();

  if (error || !repair) {
    console.error('Failed to load repair:', error);
    return null;
  }

  const { data: invoice } = await supabase
    .from('customer_tax_invoices')
    .select('*')
    .eq('repair_id', id)
    .maybeSingle();

  return { ...repair, customer_tax_invoice: invoice ?? null };
}

async function fetchCustomerVisitCount(customerId: string | null | undefined) {
  if (!customerId) return 0;

  const { count, error } = await supabase
    .from('repairs')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', customerId);

  if (error) return 0;
  return count ?? 0;
}

interface RepairDetailPageContentProps {
  repairId: string;
  autoDownloadReceipt?: boolean;
}

export default function RepairDetailPageContent({
  repairId,
  autoDownloadReceipt = false,
}: RepairDetailPageContentProps) {
  const [repair, setRepair] = useState<RepairWithRelations | null>(null);
  const [totalVisits, setTotalVisits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadRepair() {
      setLoading(true);
      setNotFound(false);

      const repairData = await fetchRepair(repairId);
      if (cancelled) return;

      if (!repairData) {
        setRepair(null);
        setNotFound(true);
        setLoading(false);
        return;
      }

      const visits = await fetchCustomerVisitCount(repairData.customer_id);
      if (cancelled) return;

      setRepair(repairData);
      setTotalVisits(visits);
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

  const estimateStatus = repair.estimate_status as EstimateStatus | undefined;

  return (
    <PageShell
      title={repair.patient_name}
      subtitle={repair.repair_id}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Repairs', href: '/dashboard/repairs' },
        { label: repair.repair_id },
      ]}
      actions={
        <RepairDetailActions
          repair={repair}
          customerTaxInvoice={repair.customer_tax_invoice}
          autoDownloadReceipt={autoDownloadReceipt}
        />
      }
    >
      <RepairDetailView
        repair={repair}
        estimateStatus={estimateStatus}
        totalVisits={totalVisits}
      />
    </PageShell>
  );
}
