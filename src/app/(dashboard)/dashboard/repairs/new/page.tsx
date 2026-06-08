'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CircularProgress, Box } from '@mui/material';
import PageShell from '@/app/components/ui/PageShell';
import RepairForm from '../_components/RepairForm';
import { supabase } from '@/lib/supabase';
import { Customer } from '@/app/types/database';

function NewRepairContent() {
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customer');
  const [prefillCustomer, setPrefillCustomer] = useState<Customer | undefined>();

  useEffect(() => {
    if (!customerId) {
      setPrefillCustomer(undefined);
      return;
    }

    supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single()
      .then(({ data }) => {
        if (data) setPrefillCustomer(data as Customer);
      })
      .catch(console.error);
  }, [customerId]);

  return (
    <PageShell
      title="New Repair"
      subtitle={
        prefillCustomer
          ? `Register a new repair for ${prefillCustomer.name}`
          : 'Register a new device for repair'
      }
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Repairs', href: '/dashboard/repairs' },
        { label: 'New Repair' },
      ]}
    >
      <RepairForm prefillCustomer={prefillCustomer} />
    </PageShell>
  );
}

export default function NewRepairPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      }
    >
      <NewRepairContent />
    </Suspense>
  );
}
