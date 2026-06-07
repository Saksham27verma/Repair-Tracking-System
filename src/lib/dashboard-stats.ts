import { createServerClient } from '@/lib/supabase/server';

export interface StatusCount {
  status: string;
  count: number;
}

export interface DailyCount {
  date: string;
  count: number;
}

export interface CenterBreakdown {
  center_id: string;
  center_name: string;
  count: number;
}

export interface CenterActiveStats {
  center_id: string;
  center_name: string;
  devices_at_center: number;
  active_repairs: number;
  at_manufacturer: number;
  in_transit: number;
  status_breakdown: { status: string; count: number }[];
}

export interface DashboardStatsData {
  statusCounts: StatusCount[];
  dailyCounts: DailyCount[];
  centerBreakdown: CenterBreakdown[];
  centerActiveStats: CenterActiveStats[];
  inTransitCount: number;
  timestamp: string;
}

export async function getDashboardStats(): Promise<DashboardStatsData> {
  const supabase = createServerClient();

  const { data: repairs, error: repairsError } = await supabase
    .from('repairs')
    .select('status, created_at, current_center_id, pickup_center_id, current_location_type, receiving_center')
    .order('updated_at', { ascending: false });

  if (repairsError) {
    throw new Error(`Failed to fetch repairs: ${repairsError.message}`);
  }

  const counts: Record<string, number> = {};
  repairs?.forEach((repair) => {
    counts[repair.status] = (counts[repair.status] || 0) + 1;
  });

  const statusCounts = Object.entries(counts).map(([status, count]) => ({
    status,
    count,
  }));

  const dailyCounts = (repairs?.reduce((acc: DailyCount[], repair) => {
    const date = new Date(repair.created_at).toISOString().split('T')[0];
    const existing = acc.find((item) => item.date === date);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ date, count: 1 });
    }
    return acc;
  }, []) || [])
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);

  let centerBreakdown: CenterBreakdown[] = [];
  let centerActiveStats: CenterActiveStats[] = [];
  const { data: centers, error: centersError } = await supabase
    .from('centers')
    .select('id, name')
    .eq('is_active', true);

  const activeRepairs = repairs?.filter((r) => r.status !== 'Completed') || [];

  if (!centersError && centers) {
    centerBreakdown = centers.map((center) => ({
      center_id: center.id,
      center_name: center.name,
      count:
        repairs?.filter(
          (r) =>
            r.current_center_id === center.id &&
            r.current_location_type === 'at_center'
        ).length || 0,
    }));

    centerActiveStats = centers.map((center) => {
      const atCenter = activeRepairs.filter(
        (r) => r.current_center_id === center.id && r.current_location_type === 'at_center'
      );
      const inTransit = activeRepairs.filter(
        (r) => r.current_center_id === center.id && r.current_location_type === 'in_transit'
      );
      const atMfr = activeRepairs.filter(
        (r) =>
          (r.current_center_id === center.id || r.pickup_center_id === center.id) &&
          r.current_location_type === 'at_manufacturer'
      );
      const linkedActive = activeRepairs.filter(
        (r) =>
          r.current_center_id === center.id ||
          r.pickup_center_id === center.id ||
          r.receiving_center === center.name
      );

      const statusMap: Record<string, number> = {};
      linkedActive.forEach((r) => {
        statusMap[r.status] = (statusMap[r.status] || 0) + 1;
      });

      return {
        center_id: center.id,
        center_name: center.name,
        devices_at_center: atCenter.length,
        active_repairs: linkedActive.length,
        at_manufacturer: atMfr.length,
        in_transit: inTransit.length,
        status_breakdown: Object.entries(statusMap).map(([status, count]) => ({ status, count })),
      };
    });
  }

  const inTransitCount =
    repairs?.filter((r) => r.current_location_type === 'in_transit').length || 0;

  return {
    statusCounts,
    dailyCounts,
    centerBreakdown,
    centerActiveStats,
    inTransitCount,
    timestamp: new Date().toISOString(),
  };
}
