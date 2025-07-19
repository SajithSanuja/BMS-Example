const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkDatabaseSchema() {
  console.log('🔍 Checking database schema and tables...');
  
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

  const tablesToCheck = [
    'user_profiles',
    'inventory_items', 
    'sales_orders',
    'purchase_orders',
    'financial_transactions',
    'suppliers'
  ];

  console.log('Testing key tables existence and structure...\n');

  for (const table of tablesToCheck) {
    try {
      console.log(`📋 Checking table: ${table}`);
      
      // Try to get table info by selecting with limit 0
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(0);

      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`   ❌ Table '${table}' does not exist`);
        } else {
          console.log(`   ⚠️  Table '${table}' exists but has error: ${error.message}`);
        }
      } else {
        console.log(`   ✅ Table '${table}' exists and is accessible`);
        
        // Try to get count
        const { count, error: countError } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (!countError) {
          console.log(`   📊 Record count: ${count || 0}`);
        }
      }
    } catch (err) {
      console.log(`   ❌ Error checking table '${table}': ${err.message}`);
    }
    console.log('');
  }

  // Check if RLS policies are working
  console.log('🔒 Testing Row Level Security...');
  try {
    // Try to access user_profiles without auth (should be restricted)
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*');

    if (error && error.message.includes('RLS')) {
      console.log('   ✅ RLS is active (access restricted without proper auth)');
    } else if (error) {
      console.log('   ⚠️  RLS test inconclusive:', error.message);
    } else {
      console.log('   ⚠️  RLS might not be configured properly (unrestricted access)');
    }
  } catch (err) {
    console.log('   ❌ RLS test failed:', err.message);
  }
}

checkDatabaseSchema().catch(console.error);
