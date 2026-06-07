#!/usr/bin/env ts-node
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL and service role key are required.');
  process.exit(1);
}

// Create a Supabase client with the service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQL() {
  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'update_repair_status_enum.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Executing SQL to update repair status enum...');
    
    // Execute the SQL using Supabase's rpc call for raw SQL
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });

    if (error) {
      console.error('Error executing SQL:', error);
      process.exit(1);
    }

    console.log('Successfully updated repair status enum and documented purpose options');
  } catch (error) {
    console.error('Error executing SQL script:', error);
    process.exit(1);
  }
}

// Run the function
executeSQL(); 