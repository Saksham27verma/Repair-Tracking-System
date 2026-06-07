import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAdminSupabaseClient } from '@/lib/supabase';
import { refreshSchemaCache } from '@/lib/supabase';
import { notifyUser } from '@/lib/notifications';

export async function POST(request: Request) {
  try {
    // Refresh the schema cache to ensure all columns are recognized
    await refreshSchemaCache('repairs');
    
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
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'Repair ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get the current status before update
    const { data: currentRepair, error: fetchError } = await supabase
      .from('repairs')
      .select('status, notification_preference, email, phone, patient_name, repair_id')
      .eq('id', id)
      .single();
      
    if (fetchError) {
      console.error('Error fetching current repair:', fetchError);
      return new Response(JSON.stringify({ error: 'Error fetching current repair status' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update the repair
    const { data: updatedRepair, error } = await supabase
      .from('repairs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating repair:', error);
      return new Response(JSON.stringify({ error: 'Failed to update repair' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check if status changed
    if (updateData.status && updateData.status !== currentRepair.status) {
      try {
        console.log(`Status changed from ${currentRepair.status} to ${updateData.status}. Sending notification...`);
        
        // Get additional product information for notification
        const { data: repairWithProduct } = await supabase
          .from('repairs')
          .select('model_item_name')
          .eq('id', id)
          .single();
          
        const productName = repairWithProduct?.model_item_name || 'your device';
        
        // Send notification about status change
        const notifyResult = await notifyUser(
          {
            email: currentRepair.email,
            name: currentRepair.patient_name,
            notificationPreference: currentRepair.notification_preference
          },
          'statusChange',
          {
            repairId: currentRepair.repair_id,
            oldStatus: currentRepair.status,
            newStatus: updateData.status,
            productName
          }
        );
        
        console.log('Notification result:', notifyResult);
        
        // Send special notification if status is "Ready for Pickup"
        if (updateData.status === 'Ready for Pickup') {
          const pickupResult = await notifyUser(
            {
              email: currentRepair.email,
              name: currentRepair.patient_name,
              notificationPreference: currentRepair.notification_preference
            },
            'repairComplete',
            {
              repairId: currentRepair.repair_id,
              productName
            }
          );
          
          console.log('Pickup notification result:', pickupResult);
        }
      } catch (notificationError) {
        console.error('Error sending notifications:', notificationError);
        // Don't fail the request if notifications fail
      }
    }
    
    return new Response(JSON.stringify({ 
      message: 'Repair updated successfully', 
      data: updatedRepair,
      notificationSent: updateData.status && updateData.status !== currentRepair.status
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Error in PUT /api/repairs:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
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