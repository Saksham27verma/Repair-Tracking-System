'use client';

import PageShell from '@/app/components/ui/PageShell';
import RepairForm from '../_components/RepairForm';

export default function NewRepairPage() {
  return (
    <PageShell
      title="New Repair"
      subtitle="Register a new device for repair"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Repairs', href: '/dashboard/repairs' },
        { label: 'New Repair' },
      ]}
    >
      <RepairForm />
    </PageShell>
  );
} 