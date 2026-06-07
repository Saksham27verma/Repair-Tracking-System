import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/lib/supabase';
import { notifyUser } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const { repairId, oldStatus, newStatus } = await request.json();

    if (!repairId || !oldStatus || !newStatus) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get admin client
    const supabase = getAdminSupabaseClient();

    // First make sure the repair exists and get its repair_id
    const { data: repair, error: repairError } = await supabase
      .from('repairs')
      .select(`
        repair_id, id, patient_name, email, notification_preference, model_item_name,
        current_location_type,
        current_center:centers!repairs_current_center_id_fkey(name),
        pickup_center:centers!repairs_pickup_center_id_fkey(name)
      `)
      .eq('id', repairId)
      .single();

    if (repairError || !repair) {
      console.error('Error finding repair for notification:', repairError);
      return NextResponse.json(
        { error: 'Repair not found' },
        { status: 404 }
      );
    }

    // Only send notification if the user has opted in
    if (repair.notification_preference === 'email' && repair.email) {
      // Send notification using notifyUser
      const result = await notifyUser(
        {
          email: repair.email,
          name: repair.patient_name,
          notificationPreference: repair.notification_preference
        },
        'statusChange',
        {
          repairId: repair.repair_id,
          oldStatus,
          newStatus,
          productName: repair.model_item_name,
          currentLocation: repair.current_center?.name
            ? `At ${repair.current_center.name}`
            : repair.current_location_type === 'at_manufacturer'
            ? 'At Manufacturer'
            : repair.current_location_type === 'in_transit'
            ? 'In Transit'
            : undefined,
          pickupCenter: repair.pickup_center?.name,
        }
      );

      // Update the notification_sent flag in the status_change_logs
      if (result.success) {
        // Find the most recent status change log for this repair
        const { data: logs, error: logsError } = await supabase
          .from('status_change_logs')
          .select('id')
          .eq('repair_id', repairId)
          .eq('old_status', oldStatus)
          .eq('new_status', newStatus)
          .order('changed_at', { ascending: false })
          .limit(1);

        if (!logsError && logs && logs.length > 0) {
          // Update the notification_sent flag
          await supabase
            .from('status_change_logs')
            .update({ notification_sent: true })
            .eq('id', logs[0].id);
        }

        return NextResponse.json({
          success: true,
          message: 'Notification sent successfully'
        });
      } else {
        return NextResponse.json({
          success: false,
          message: 'Failed to send notification',
          details: result
        });
      }
    } else {
      return NextResponse.json({
        success: false,
        message: 'User has not opted in for email notifications'
      });
    }
  } catch (error) {
    console.error('Error processing status change notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 