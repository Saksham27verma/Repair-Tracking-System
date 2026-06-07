import { NextResponse } from 'next/server';
import { getFreshSupabaseClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getFreshSupabaseClient();
    const { data, error } = await supabase
      .from('centers')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching centers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
