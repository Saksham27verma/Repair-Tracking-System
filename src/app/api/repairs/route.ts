import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const data = await request.json();
    
    const result = await supabase
      .from('repairs')
      .insert([data])
      .select()
      .single();

    if (result.error) {
      console.error('Error creating repair:', result.error);
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in repair creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createServerClient();
    const data = await request.json();
    const { id, ...updateData } = data;

    const result = await supabase
      .from('repairs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (result.error) {
      console.error('Error updating repair:', result.error);
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in repair update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    // Use getFreshSupabaseClient from lib/supabase.ts for better reliability
    const { getFreshSupabaseClient, getAdminSupabaseClient } = await import('@/lib/supabase');
    const supabase = getAdminSupabaseClient(); // Use admin client for deletion
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    console.log(`Attempting to delete repair with ID: ${id}`);

    // First check if the record exists
    const { data: repair, error: fetchError } = await supabase
      .from('repairs')
      .select('id, repair_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error finding repair to delete:', fetchError);
      return NextResponse.json(
        { error: `Record not found: ${fetchError.message}` },
        { status: 404 }
      );
    }

    if (!repair) {
      return NextResponse.json(
        { error: 'Repair record not found' },
        { status: 404 }
      );
    }

    // Proceed with deletion
    const result = await supabase
      .from('repairs')
      .delete()
      .eq('id', id);

    if (result.error) {
      console.error('Error deleting repair:', result.error);
      return NextResponse.json(
        { error: `Failed to delete repair: ${result.error.message}` },
        { status: 400 }
      );
    }

    console.log(`Successfully deleted repair with ID: ${id}`);
    
    // Try to invalidate cache if we have a repair_id
    if (repair.repair_id) {
      try {
        const cacheUrl = new URL('/api/cache-invalidate', request.url);
        cacheUrl.searchParams.set('repair_id', repair.repair_id);
        cacheUrl.searchParams.set('id', id);
        
        await fetch(cacheUrl.toString(), {
          method: 'POST',
          cache: 'no-store',
        });
      } catch (cacheError) {
        console.warn('Failed to invalidate cache, but deletion was successful:', cacheError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Repair record deleted successfully'
    });
  } catch (error) {
    console.error('Error in repair deletion:', error);
    return NextResponse.json(
      { error: 'Internal server error during deletion' },
      { status: 500 }
    );
  }
} 