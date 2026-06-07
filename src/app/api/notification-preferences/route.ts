import { NextRequest, NextResponse } from 'next/server';
import { getFreshSupabaseClient } from '@/lib/supabase';

export async function PUT(request: NextRequest) {
  try {
    // Parse request body with error handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Error parsing request body in PUT handler:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { repairId, email, preference } = body;

    if (!repairId) {
      return NextResponse.json(
        { error: 'Repair ID is required' },
        { status: 400 }
      );
    }

    if (!['email', 'none'].includes(preference)) {
      return NextResponse.json(
        { error: 'Invalid notification preference' },
        { status: 400 }
      );
    }

    if (preference === 'email' && !email) {
      return NextResponse.json(
        { error: 'Email is required for email notifications' },
        { status: 400 }
      );
    }

    const supabase = getFreshSupabaseClient();

    // Update the repairs table with notification preferences
    const { data, error } = await supabase
      .from('repairs')
      .update({
        notification_preference: preference,
        email: email
      })
      .eq('repair_id', repairId)
      .select('repair_id, notification_preference, email');

    if (error) {
      console.error('Error updating notification preferences:', error);
      return NextResponse.json(
        { error: 'Failed to update notification preferences' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Repair not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Notification preferences updated successfully',
      data: data[0]
    });
  } catch (error) {
    console.error('Error in notification preferences update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const repairId = url.searchParams.get('repairId');

    if (!repairId) {
      console.warn('GET request missing repairId parameter');
      return NextResponse.json(
        { error: 'Repair ID is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching notification preferences for repair: ${repairId}`);
    const supabase = getFreshSupabaseClient();

    try {
      const { data, error } = await supabase
        .from('repairs')
        .select('notification_preference, email')
        .eq('repair_id', repairId)
        .single();

      if (error) {
        console.error('Supabase error fetching notification preferences:', error);
        return NextResponse.json(
          { error: 'Failed to fetch notification preferences' },
          { status: 500 }
        );
      }

      console.log(`Successfully fetched preferences for ${repairId}:`, data);
      return NextResponse.json({
        preference: data?.notification_preference || 'none',
        email: data?.email || '',
      });
    } catch (dbError) {
      console.error('Database error in notification preferences GET:', dbError);
      return NextResponse.json(
        { error: 'Database error fetching preferences' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unhandled error in fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
} 