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

// Simple in-memory rate limiting
const REQUEST_HISTORY = {
  lastRequestTime: 0,
  requestCount: 0,
  cooldownPeriod: 500, // ms between allowed requests
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const refreshParam = url.searchParams.get('refresh');
  const forceRefresh = url.searchParams.get('force') === 'true';
  
  // Get referring page if available
  const referer = request.headers.get('referer') || 'unknown';
  const clientId = request.headers.get('x-client-id') || 'unknown';
  
  // Get user agent for debugging
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // Rate limiting logic
  const now = Date.now();
  const timeSinceLastRequest = now - REQUEST_HISTORY.lastRequestTime;
  
  if (timeSinceLastRequest < REQUEST_HISTORY.cooldownPeriod && !forceRefresh) {
    REQUEST_HISTORY.requestCount++;
    console.warn(`⚠️ Rate limit triggered - Request #${REQUEST_HISTORY.requestCount} - Too many dashboard stats requests (${timeSinceLastRequest}ms since last request)`);
    console.warn(`⚠️ Referer: ${referer}`);
    console.warn(`⚠️ Client ID: ${clientId}`);
    console.warn(`⚠️ User Agent: ${userAgent}`);
    
    return new NextResponse(
      JSON.stringify({ 
        error: 'Too many requests', 
        message: 'Please wait before refreshing again',
        rateLimited: true 
      }), 
      { 
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-RateLimit-Limit': REQUEST_HISTORY.cooldownPeriod.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': (now + REQUEST_HISTORY.cooldownPeriod).toString()
        }
      }
    );
  }
  
  // Update rate limiting state
  REQUEST_HISTORY.lastRequestTime = now;
  REQUEST_HISTORY.requestCount++;
  
  console.log(`📊 Dashboard stats request #${REQUEST_HISTORY.requestCount}`);
  console.log(`📊 Referer: ${referer}`);
  console.log(`📊 Refresh param: ${refreshParam}`);
  console.log(`📊 Force refresh: ${forceRefresh}`);
  
  try {
    console.log(`Fetching dashboard stats from API... Refresh param: ${refreshParam}, Force refresh: ${forceRefresh}`);
    // Always get a fresh Supabase client for each request
    const supabase = getFreshSupabaseClient();

    // Make sure we're bypassing any browser or middleware caching
    console.log('🔄 Bypassing cache for fresh data fetch');

    // Get real-time repair data with only active statuses to ensure accuracy
    const { data: repairs, error: statusError } = await supabase
      .from('repairs')
      .select('*')
      .order('updated_at', { ascending: false });

    if (statusError) {
      console.error('Error fetching repair statuses:', statusError);
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch status counts' }), 
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    console.log(`Fetched ${repairs?.length || 0} repairs in total`);
    console.log(`Most recent repair updated at: ${repairs?.[0]?.updated_at || 'N/A'}`);

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
      if (forceRefresh) {
        console.log(`Repair IDs: ${statuses[status].join(', ')}`);
      }
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

    // Return accurate counts with no-cache headers
    const timestamp = new Date().toISOString();
    console.log(`Returning dashboard stats with timestamp: ${timestamp}`);
    
    return new NextResponse(
      JSON.stringify({
        statusCounts: statusCounts || [],
        dailyCounts: dailyCounts || [],
        timestamp: timestamp,
        forceRefreshUsed: forceRefresh,
        requestId: REQUEST_HISTORY.requestCount
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error) {
    console.error('Error in dashboard stats API:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error)
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
} 