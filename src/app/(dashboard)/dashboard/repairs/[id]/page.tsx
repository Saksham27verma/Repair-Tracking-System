import { notFound } from 'next/navigation';
import { getFreshSupabaseClient } from '@/lib/supabase';
import { EstimateStatus } from '@/app/types/database';
import PageShell from '@/app/components/ui/PageShell';
import RepairDetailView from '../_components/RepairDetailView';
import RepairDetailActions from '../_components/RepairDetailActions';

export const dynamic = 'force-dynamic';

async function getRepair(id: string) {
  const freshClient = getFreshSupabaseClient();
  const { data: repair, error } = await freshClient
    .from('repairs')
    .select(`
      *,
      current_center:centers!repairs_current_center_id_fkey(id, name),
      pickup_center:centers!repairs_pickup_center_id_fkey(id, name)
    `)
    .eq('id', id)
    .single();

  if (error || !repair) return null;

  const { data: invoice } = await freshClient
    .from('customer_tax_invoices')
    .select('*')
    .eq('repair_id', id)
    .maybeSingle();

  return { ...repair, customer_tax_invoice: invoice ?? null };
}

async function getCustomerVisitCount(customerId: string | null | undefined) {
  if (!customerId) return 0;

  const freshClient = getFreshSupabaseClient();
  const { count, error } = await freshClient
    .from('repairs')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', customerId);

  if (error) return 0;
  return count ?? 0;
}

export default async function RepairDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { receipt?: string };
}) {
  const repair = await getRepair(params.id);
  if (!repair) notFound();

  const totalVisits = await getCustomerVisitCount(repair.customer_id);
  const estimateStatus = repair.estimate_status as EstimateStatus | undefined;
  const autoDownloadReceipt = searchParams?.receipt === '1';

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
