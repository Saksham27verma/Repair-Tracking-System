import { Box, Typography } from '@mui/material';
import { type Database } from '@/app/types/supabase';
import DashboardCharts from './_components/DashboardCharts';
import { createServerClient } from '@/lib/supabase/server';

interface StatusCount {
  status: Database['public']['Enums']['repair_status'];
  count: number;
}

interface DailyCount {
  date: string;
  count: number;
}

async function getDashboardStats() {
  try {
    const supabase = createServerClient();

    // Get status counts
    const { data: statusCounts } = await supabase
      .from('repairs')
      .select('status')
      .then(result => {
        const counts: { [key: string]: number } = {};
        result.data?.forEach(repair => {
          counts[repair.status] = (counts[repair.status] || 0) + 1;
        });
        return {
          data: Object.entries(counts).map(([status, count]) => ({
            status,
            count,
          })),
        };
      });

    // Get daily counts
    const { data: repairs } = await supabase
      .from('repairs')
      .select('created_at')
      .order('created_at', { ascending: true });

    const dailyCounts = repairs?.reduce((acc: DailyCount[], repair) => {
      const date = new Date(repair.created_at).toISOString().split('T')[0];
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ date, count: 1 });
      }
      return acc;
    }, []).slice(-30) || [];

    return {
      statusCounts: statusCounts || [],
      dailyCounts: dailyCounts || [],
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      statusCounts: [],
      dailyCounts: [],
    };
  }
}

export default async function DashboardPage() {
  try {
    const stats = await getDashboardStats();
    return <DashboardCharts {...stats} />;
  } catch (error) {
    return <div>Error loading dashboard statistics</div>;
  }
} 