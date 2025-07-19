const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testConnection() {
  console.log('Testing Supabase connection...');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
  console.log('SERVICE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log('SERVICE_KEY value:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...');

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing environment variables!');
    console.error('SUPABASE_URL:', process.env.SUPABASE_URL);
    console.error('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY);
    return;
  }

  if (process.env.SUPABASE_SERVICE_ROLE_KEY === 'your_service_role_key_here') {
    console.error('❌ Service role key is still set to placeholder value!');
    console.error('Please update SUPABASE_SERVICE_ROLE_KEY in your .env file with the actual key from Supabase dashboard');
    return;
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Test basic connection by trying to fetch from a simple table
    console.log('Attempting to connect to Supabase...');
    
    // Try to query inventory_items table
    const { data, error } = await supabase
      .from('inventory_items')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Database query failed:', error.message);
      console.error('Error details:', error);
      
      if (error.message.includes('relation "inventory_items" does not exist')) {
        console.log('🔍 Checking available tables...');
        // Try to list tables using the information_schema
        const { data: tables, error: tablesError } = await supabase
          .rpc('list_tables'); // This might not work, let's try another approach

        if (tablesError) {
          console.log('Could not list tables. The inventory_items table may not exist yet.');
          console.log('You may need to run the database schema setup first.');
        }
      }
    } else {
      console.log('✅ Successfully connected to Supabase!');
      console.log('Query result:', data);
    }

    // Test auth table access
    console.log('Testing auth.users table access...');
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Auth admin access failed:', authError.message);
      console.log('This might indicate the service role key is incorrect or lacks proper permissions');
    } else {
      console.log('✅ Auth admin access successful!');
      console.log(`Found ${authData.users?.length || 0} users in auth.users`);
    }

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.error('Full error:', error);
  }
}

testConnection().catch(console.error);
