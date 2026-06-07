'use client';

import PageShell from '@/app/components/ui/PageShell';
import RepairForm from '../../_components/RepairForm';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';

async function getRepair(id: string) {
  const { data: repair, error } = await supabase
    .from('repairs')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !repair) {
    return null;
  }

  return repair;
}

export default async function EditRepairPage({
  params,
}: {
  params: { id: string };
}) {
  const repair = await getRepair(params.id);

  if (!repair) {
    notFound();
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