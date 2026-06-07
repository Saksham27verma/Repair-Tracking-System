import { NextResponse } from 'next/server';
import { getFreshSupabaseClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { message: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { message: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Use fresh client that bypasses cache
    const supabase = getFreshSupabaseClient();

    // Query repair record
    try {
      const { data: repair, error } = await supabase
        .from('repairs')
        .select('repair_id')
        .eq('phone', phone)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !repair) {
        console.error('No repair found for phone:', phone);
        return NextResponse.json(
          { message: 'No repair found with the provided phone number' },
          { status: 404 }
        );
      }

      return NextResponse.json({ repairId: repair.repair_id });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { message: 'Error querying the database' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unhandled error in verify route:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 