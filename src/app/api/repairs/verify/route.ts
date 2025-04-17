import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { name, phone } = await request.json();

    // Query repair record
    const { data: repair, error } = await supabase
      .from('repairs')
      .select('*')
      .eq('patient_name', name)
      .eq('phone', phone)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !repair) {
      return NextResponse.json(
        { message: 'No repair found with the provided name and phone number' },
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