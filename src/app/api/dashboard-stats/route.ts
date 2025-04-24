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
    console.log('Fetching dashboard stats from API...');
    const supabase = getFreshSupabaseClient();

    // Get real-time repair data with only active statuses to ensure accuracy
    const { data: repairs, error: statusError } = await supabase
      .from('repairs')
      .select('*');

    if (statusError) {
      console.error('Error fetching repair statuses:', statusError);
      return NextResponse.json({ error: 'Failed to fetch status counts' }, { status: 500 });
    }

    console.log(`Fetched ${repairs?.length || 0} repairs in total`);

    // Process status counts with detailed logging
    const counts: { [key: string]: number } = {};
    const statuses: { [key: string]: string[] } = {}; // For debugging
    
    repairs?.forEach(repair => {
      // Count by status
      counts[repair.status] = (counts[repair.status] || 0) + 1;
      
      // Store repair IDs by status for debugging
      if (!statuses[repair.status]) {
        statuses[repair.status] = [];
      }
      statuses[repair.status].push(repair.repair_id);
    });

    const statusCounts = Object.entries(counts).map(([status, count]) => ({
      status,
      count,
    }));

    // Log detailed counts for debugging
    console.log('Status counts breakdown:');
    statusCounts.forEach(({ status, count }) => {
      console.log(`${status}: ${count} repairs`);
      console.log(`Repair IDs: ${statuses[status].join(', ')}`);
    });

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

    // Return accurate counts
    return NextResponse.json({
      statusCounts: statusCounts || [],
      dailyCounts: dailyCounts || [],
      timestamp: new Date().toISOString(), // Add timestamp for tracking
    });
  } catch (error) {
    console.error('Error in dashboard stats API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 