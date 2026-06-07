import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local if running locally
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '.env.local' });
}

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase environment variables');
  process.exit(1);
}

// Create a Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function run() {
  console.log('Starting schema refresh and validation...');

  try {
    // First, check if the email column exists in the repairs table
    console.log('Checking if email column exists in repairs table...');
    const { data: columnInfo, error: columnCheckError } = await supabase
      .from('repairs')
      .select('email')
      .limit(1);

    if (columnCheckError) {
      console.error('Error checking for email column:', columnCheckError.message);
      
      // If the column doesn't exist, try to add it
      if (columnCheckError.message.includes('column "email" does not exist')) {
        console.log('Email column does not exist. Attempting to add it...');
        
        // Add the email column to the repairs table
        const { error: alterError } = await supabase.rpc('add_email_to_repairs');
        
        if (alterError) {
          console.error('Failed to add email column:', alterError.message);
          
          // Try a direct SQL approach if RPC fails
          const { error: sqlError } = await supabase.rpc('execute_sql', { 
            sql_query: 'ALTER TABLE repairs ADD COLUMN IF NOT EXISTS email TEXT;' 
          });
          
          if (sqlError) {
            console.error('Failed to add email column via SQL:', sqlError.message);
          } else {
            console.log('Successfully added email column via SQL');
          }
        } else {
          console.log('Successfully added email column via RPC');
        }
      }
    } else {
      console.log('Email column exists in repairs table');
    }

    // Refresh the schema cache
    console.log('Refreshing schema cache...');
    const { data: refreshData, error: refreshError } = await supabase
      .from('repairs')
      .select('id, email')
      .limit(1);
      
    if (refreshError) {
      console.error('Error refreshing schema cache:', refreshError.message);
    } else {
      console.log('Schema cache refreshed successfully');
    }

    // Check customer lookup functionality
    console.log('Testing customer lookup...');
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id, name, phone, email')
      .limit(1);
      
    if (customerError) {
      console.error('Error looking up customers:', customerError.message);
    } else {
      console.log('Customer lookup successful. Found:', customers?.length || 0, 'customers');
    }

    console.log('Schema refresh and validation complete');
  } catch (error) {
    console.error('Unexpected error during schema refresh:', error);
  }
}

run().catch(console.error); 