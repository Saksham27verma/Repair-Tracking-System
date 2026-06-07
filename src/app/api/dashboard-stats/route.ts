import { NextResponse } from 'next/server';
import { getDashboardStats } from '@/lib/dashboard-stats';

export async function GET() {
  try {
    const stats = await getDashboardStats();

    return NextResponse.json(stats, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    console.error('Error in dashboard stats API:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch dashboard stats',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
