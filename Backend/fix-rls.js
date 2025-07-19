const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function fixRLS() {
  console.log('🔧 Fixing RLS policies...');
  
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

  try {
    // Temporarily disable RLS on user_profiles table
    console.log('1️⃣ Disabling RLS on user_profiles...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;'
    });

    if (rlsError) {
      console.log('⚠️ Could not disable RLS via RPC, trying direct SQL...');
      
      // Try using a direct query instead
      const { error: directError } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);
        
      if (directError && directError.message.includes('infinite recursion')) {
        console.log('❌ RLS issue confirmed. Need to fix in Supabase dashboard.');
        console.log('');
        console.log('🛠️ Manual fix required:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Go to Authentication > Policies'); 
        console.log('3. Temporarily disable all policies on user_profiles table');
        console.log('4. Or run this SQL in the SQL editor:');
        console.log('   ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;');
      }
    } else {
      console.log('✅ RLS disabled successfully');
    }

    // Test profile access after RLS fix
    console.log('\n2️⃣ Testing profile access...');
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*');

    if (profileError) {
      console.log('❌ Still having issues:', profileError.message);
    } else {
      console.log('✅ Profile access working!');
      console.log('Profiles found:', profiles?.length || 0);
      profiles?.forEach(p => {
        console.log(`  - ${p.full_name} (${p.email || 'no email'}) - ${p.role}`);
      });
    }

  } catch (error) {
    console.log('❌ Fix failed:', error.message);
  }
}

fixRLS().catch(console.error);
