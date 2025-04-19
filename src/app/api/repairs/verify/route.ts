import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { message: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Query repair record
    const { data: repair, error } = await supabase
      .from('repairs')
      .select('*')
      .eq('phone', phone)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !repair) {
      return NextResponse.json(
        { message: 'No repair found with the provided phone number' },
        { status: 404 }
      );
    }

    return NextResponse.json({ repairId: repair.repair_id });
  } catch (error) {
    console.error('Error verifying repair:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 