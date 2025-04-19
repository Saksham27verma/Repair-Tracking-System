import { createClient } from '@supabase/supabase-js'
import { type Database } from '@/app/types/supabase'
import 'server-only'

// Check if environment variables are defined
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Validate that we have the required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set. Auth functionality will not work.')
}

// Create a Supabase client for the browser
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Get a fresh Supabase client (bypassing any caching)
export function getFreshSupabaseClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  })
}

// Same but with the service role key for admin operations
export function getAdminSupabaseClient() {
  if (!supabaseServiceKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY is not set. Admin operations will not work.')
  }
  
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  })
}

// This function can be used to refresh the schema cache for a specific table
export async function refreshSchemaCache(table = 'repairs') {
  try {
    // Simply get a small amount of data to refresh the schema
    const admin = getAdminSupabaseClient()
    await admin.from(table).select('id').limit(1)
    console.log(`Schema cache refreshed for ${table}`)
  } catch (error) {
    console.error('Error refreshing schema cache:', error)
  }
}

// Helper function to generate repair IDs
export function generateRepairId(): string {
  const now = new Date()
  const year = now.getFullYear().toString().slice(2) // Last two digits of year
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  
  // Generate a random 4 digit number for the last part
  const random = Math.floor(Math.random() * 9000) + 1000 // 1000-9999
  
  // Format: REPYYMMDDXXXX
  return `REP${year}${month}${day}${random}`
} 