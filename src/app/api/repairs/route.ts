import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAdminSupabaseClient } from '@/lib/supabase';
import { refreshSchemaCache } from '@/lib/supabase';

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
  console.log('DELETE request received in repairs API route');
  
  try {
    // Get the repair id from the URL
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    console.log('Attempting to delete repair with ID:', id);
    
    if (!id) {
      console.error('No ID provided for deletion');
      return Response.json({ error: 'No repair ID provided' }, { status: 400 });
    }

    try {
      // First check if the record exists
      const supabase = getAdminSupabaseClient();
      console.log('Got admin Supabase client');
      
      // Verify the record exists first
      const { data: existingRepair, error: fetchError } = await supabase
        .from('repairs')
        .select('id')
        .eq('id', id)
        .single();
      
      if (fetchError || !existingRepair) {
        console.error('Record not found or error fetching:', fetchError);
        return Response.json(
          { error: `Repair not found: ${fetchError?.message || 'No record with that ID exists'}` }, 
          { status: 404 }
        );
      }
      
      console.log('Found repair record, proceeding with deletion');
      
      // Proceed with deletion
      const { error: deleteError } = await supabase
        .from('repairs')
        .delete()
        .eq('id', id);
      
      if (deleteError) {
        console.error('Error in Supabase deletion:', deleteError);
        throw new Error(`Supabase deletion error: ${deleteError.message}`);
      }
      
      console.log('Repair successfully deleted');
      
      // Try to invalidate cache if successful
      try {
        await refreshSchemaCache('repairs');
        console.log('Cache refreshed after deletion');
      } catch (cacheError) {
        console.warn('Failed to refresh cache, but deletion was successful:', cacheError);
      }
      
      return Response.json({ success: true, message: 'Repair deleted successfully' });
    } catch (supabaseError) {
      console.error('Supabase operation error:', supabaseError);
      return Response.json(
        { error: `Database error: ${supabaseError instanceof Error ? supabaseError.message : 'Unknown error'}` }, 
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in DELETE handler:', error);
    return Response.json(
      { error: 'Server error occurred during deletion' }, 
      { status: 500 }
    );
  }
} 