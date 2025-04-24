import { NextResponse } from 'next/server';
import { getFreshSupabaseClient } from '@/lib/supabase';
import { RepairStatus } from '@/app/types/database';

interface StatusCount {
  status: RepairStatus | string;
  count: number;
}

interface DailyCount {
  date: string;
  count: number;
}

export async function GET() {
  try {
    const supabase = getFreshSupabaseClient();

    // Get status counts
    const { data: repairs, error: statusError } = await supabase
      .from('repairs')
      .select('status, created_at');

    if (statusError) {
      console.error('Error fetching repair statuses:', statusError);
      return NextResponse.json({ error: 'Failed to fetch status counts' }, { status: 500 });
    }

    // Process status counts
    const counts: { [key: string]: number } = {};
    repairs?.forEach(repair => {
      counts[repair.status] = (counts[repair.status] || 0) + 1;
    });

    const statusCounts = Object.entries(counts).map(([status, count]) => ({
      status,
      count,
    }));

    // Process daily counts
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

    return NextResponse.json({
      statusCounts: statusCounts || [],
      dailyCounts: dailyCounts || [],
    });
  } catch (error) {
    console.error('Error in dashboard stats API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 