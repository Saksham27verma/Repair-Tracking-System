import DashboardCharts from './_components/DashboardCharts';
import PageShell from '@/app/components/ui/PageShell';
import EmailPopupHandler from './EmailPopupHandler';
import { Suspense } from 'react';
import { getDashboardStats } from '@/lib/dashboard-stats';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  let stats = {
    statusCounts: [] as { status: string; count: number }[],
    dailyCounts: [] as { date: string; count: number }[],
    centerBreakdown: [] as { center_id: string; center_name: string; count: number }[],
    centerActiveStats: [] as {
      center_id: string;
      center_name: string;
      devices_at_center: number;
      active_repairs: number;
      at_manufacturer: number;
      in_transit: number;
      status_breakdown: { status: string; count: number }[];
    }[],
    inTransitCount: 0,
    timestamp: new Date().toISOString(),
  };

  try {
    stats = await getDashboardStats();
  } catch (error) {
    console.error('Failed to load dashboard stats server-side:', error);
  }

  return (
    <PageShell title="Dashboard" subtitle="Overview of repair operations across all centers">
      <Suspense fallback={null}>
        <EmailPopupHandler />
      </Suspense>
      <DashboardCharts
        initialStatusCounts={stats.statusCounts}
        initialDailyCounts={stats.dailyCounts}
        initialCenterBreakdown={stats.centerBreakdown}
        initialCenterActiveStats={stats.centerActiveStats}
        initialInTransitCount={stats.inTransitCount}
        initialTimestamp={stats.timestamp}
      />
    </PageShell>
  );
}
