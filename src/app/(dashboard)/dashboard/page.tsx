import { Box, Typography } from '@mui/material';
import { type Database } from '@/app/types/supabase';
import DashboardCharts from './_components/DashboardCharts';
import { createServerClient } from '@/lib/supabase/server';
import { RepairStatus } from '@/app/types/database';
import PageHeader from '@/app/components/PageHeader';
import { getFreshSupabaseClient } from '@/lib/supabase';
import EmailPopupHandler from './EmailPopupHandler';
import { Suspense } from 'react';

interface StatusCount {
  status: RepairStatus | string;
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
  const { statusCounts, dailyCounts } = await getDashboardStats();

  return (
    <div>
      {/* Client component to handle email popup wrapped in Suspense */}
      <Suspense fallback={null}>
        <EmailPopupHandler />
      </Suspense>
      
      <PageHeader 
        title="Dashboard" 
      />
      <DashboardCharts 
        statusCounts={statusCounts}
        dailyCounts={dailyCounts}
      />
    </div>
  );
} 