import { createClient } from '@supabase/supabase-js'
import { type Database } from '@/app/types/supabase'
import { nanoid } from 'nanoid'

// Check if environment variables are defined
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Validate that we have the required environment variables
if (typeof window === 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn('Supabase environment variables are not set. Auth functionality will not work.')
}

// Create a client with the supabase URL and anon key
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

// Create a service role client for admin operations
export function getAdminSupabaseClient() {
  const supabaseServiceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
  return supabaseServiceClient
}

// Function to get a fresh client for direct API calls
export function getFreshSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
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