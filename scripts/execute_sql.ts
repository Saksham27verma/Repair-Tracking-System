import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

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
  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'add_email_to_repairs.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('Executing SQL to add email column to repairs table...');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    // Execute each statement
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      
      try {
        // Use Supabase's stored procedure to execute SQL
        const { error } = await supabase.rpc('execute_sql', { 
          sql_query: statement + ';' 
        });
        
        if (error) {
          console.error(`Error executing SQL statement: ${error.message}`);
          
          // Try an alternative approach
          console.log('Trying alternative approach...');
          
          // For Supabase, we can create a migration file and apply it
          const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
          const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', `${timestamp}_add_email_to_repairs.sql`);
          
          // Ensure the migrations directory exists
          if (!fs.existsSync(path.dirname(migrationPath))) {
            fs.mkdirSync(path.dirname(migrationPath), { recursive: true });
          }
          
          // Write the SQL to a migration file
          fs.writeFileSync(migrationPath, sqlContent, 'utf8');
          console.log(`Created migration file: ${migrationPath}`);
          console.log('Please run "supabase db push" to apply the migration');
        }
      } catch (stmtError) {
        console.error(`Exception executing statement: ${stmtError}`);
      }
    }

    // Verify the column was added
    console.log('Verifying email column was added...');
    const { data, error } = await supabase
      .from('repairs')
      .select('email')
      .limit(1);
      
    if (error) {
      console.error('Error verifying email column:', error.message);
    } else {
      console.log('Email column successfully added to repairs table');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

run().catch(console.error); 