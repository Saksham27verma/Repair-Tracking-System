import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    // Get the repair_id from the URL
    const repairId = request.nextUrl.searchParams.get('repair_id');

    if (!repairId) {
      return NextResponse.json({ success: false, message: 'No repair ID provided' }, { status: 400 });
    }

    // Revalidate the customer-facing repair page
    revalidatePath(`/repairs/${repairId}`);
    revalidatePath('/repairs');
    
    // Also revalidate dashboard paths
    revalidatePath('/dashboard/repairs');
    
    const repairNumericId = request.nextUrl.searchParams.get('id');
    if (repairNumericId) {
      revalidatePath(`/dashboard/repairs/${repairNumericId}`);
    }

    console.log(`Cache invalidated for repair ID: ${repairId}`);

    return NextResponse.json({ 
      success: true, 
      message: `Cache invalidated for repair ID: ${repairId}` 
    });
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to invalidate cache' 
    }, { status: 500 });
  }
} 