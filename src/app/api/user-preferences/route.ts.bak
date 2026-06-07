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

    const { email, notificationPreference } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!['email', 'none'].includes(notificationPreference)) {
      return NextResponse.json(
        { error: 'Invalid notification preference' },
        { status: 400 }
      );
    }

    console.log(`Updating user preferences for email: ${email}`);
    const supabase = getFreshSupabaseClient();

    try {
      // Update any repairs with this email
      const { data, error } = await supabase
        .from('repairs')
        .update({
          notification_preference: notificationPreference,
          email: email
        })
        .eq('email', email)
        .select('repair_id');

      if (error) {
        console.error('Error updating user preferences:', error);
        return NextResponse.json(
          { error: 'Failed to update user preferences' },
          { status: 500 }
        );
      }

      // Check if any repairs were updated
      const updatedCount = data?.length || 0;
      console.log(`Updated ${updatedCount} repairs with email: ${email}`);

      return NextResponse.json({
        message: `Preferences updated for ${updatedCount} repairs`,
        updatedCount,
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Database error updating preferences' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unhandled error in user preferences update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching user preferences for email: ${email}`);
    const supabase = getFreshSupabaseClient();

    try {
      // Find the most recent repair with this email
      const { data, error } = await supabase
        .from('repairs')
        .select('notification_preference, email')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // If no repairs found, that's okay - return default preferences
        if (error.code === 'PGRST116') {
          return NextResponse.json({
            preference: 'none',
            email: email,
          });
        }
        
        console.error('Error fetching user preferences:', error);
        return NextResponse.json(
          { error: 'Failed to fetch user preferences' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        preference: data?.notification_preference || 'none',
        email: data?.email || email,
      });
    } catch (dbError) {
      console.error('Database error in user preferences GET:', dbError);
      return NextResponse.json(
        { error: 'Database error fetching preferences' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unhandled error in fetching user preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 