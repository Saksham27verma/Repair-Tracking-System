import { createClient } from '@supabase/supabase-js'
import { type Database } from '@/app/types/supabase'

// Create a single instance of the Supabase client
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    db: {
      schema: 'public'
    }
  }
)

// Get a fresh supabase client that won't use any cached data
export function getFreshSupabaseClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  );
}

// This function can be used to refresh the schema cache for a specific table
export async function refreshSchemaCache(table = 'repairs') {
  try {
    // Create a new client to ensure we don't use any cached schema
    const freshClient = getFreshSupabaseClient();
    
    // Force a lightweight query to refresh the schema
    await freshClient
      .from(table)
      .select('id')
      .limit(1);
      
    console.log(`Schema cache refreshed for table: ${table}`);
    return true;
  } catch (error) {
    console.error('Error refreshing schema cache:', error);
    return false;
  }
}

// Helper function to generate repair IDs
export function generateRepairId(): string {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `REP${year}${month}${day}${random}`
} 