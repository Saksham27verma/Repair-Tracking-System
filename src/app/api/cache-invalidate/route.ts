import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

// List of paths to revalidate
const PATHS_TO_REVALIDATE = [
  '/dashboard',
  '/dashboard/repairs',
  '/dashboard/customers',
  '/dashboard/reports',
  '/repairs'
];

// List of tags to revalidate
const TAGS_TO_REVALIDATE = [
  'repairs',
  'customers',
  'dashboard'
];

export async function POST(request: NextRequest) {
  try {
    // Get the repair_id from the URL
    const repairId = request.nextUrl.searchParams.get('repair_id');
    const id = request.nextUrl.searchParams.get('id');

    console.log(`📣 Cache invalidation requested for repair: ${repairId} (ID: ${id})`);

    if (!repairId) {
      console.warn('❌ No repair ID provided for cache invalidation');
      return NextResponse.json({ success: false, message: 'No repair ID provided' }, { status: 400 });
    }

    // Revalidate specific repair pages
    console.log(`🔄 Revalidating repair page: /repairs/${repairId}`);
    revalidatePath(`/repairs/${repairId}`);
    
    // Revalidate all repairs listing page
    console.log('🔄 Revalidating repairs listing');
    revalidatePath('/repairs');
    
    // Revalidate all dashboard paths
    console.log('🔄 Revalidating all dashboard paths');
    PATHS_TO_REVALIDATE.forEach(path => {
      console.log(`  - Revalidating: ${path}`);
      revalidatePath(path);
    });
    
    // Revalidate specific repair in dashboard if ID is provided
    if (id) {
      console.log(`🔄 Revalidating dashboard repair: /dashboard/repairs/${id}`);
      revalidatePath(`/dashboard/repairs/${id}`);
    }
    
    // Revalidate by tags if available
    if (typeof revalidateTag === 'function') {
      console.log('🔄 Revalidating by tags');
      TAGS_TO_REVALIDATE.forEach(tag => {
        console.log(`  - Revalidating tag: ${tag}`);
        try {
          revalidateTag(tag);
        } catch (tagError) {
          console.warn(`⚠️ Error revalidating tag '${tag}':`, tagError);
        }
      });
    }

    // Force navigation refresh through a timestamp in the URL
    // This helps with browser caching even when server-side rendering is fresh
    
    console.log('✅ Cache invalidation completed successfully');

    return NextResponse.json({ 
      success: true, 
      message: `Cache invalidated for repair ID: ${repairId}`,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('❌ Cache invalidation error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to invalidate cache',
      error: error instanceof Error ? error.message : String(error)
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
} 