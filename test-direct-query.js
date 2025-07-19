const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://agzfvykqwbvgxvjlnhrd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnemZ2eWtxd2J2Z3h2amxuaHJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5MzY5ODUsImV4cCI6MjA1MjUxMjk4NX0.jNUcfHCFXCU-Fqft8MiOl4bO6dMH4Xz_wY3THDgEvac';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDirectQuery() {
  try {
    console.log('🔍 Testing direct query to user_profiles table...\n');

    // Test 1: Get all profiles (this should work if table exists)
    const { data: allProfiles, error: allError } = await supabase
      .from('user_profiles')
      .select('*');

    console.log('📋 All profiles query:');
    console.log('- Error:', allError);
    console.log('- Data:', allProfiles);
    console.log('');

    // Test 2: Get specific manager profile
    const managerId = 'b0e693be-29fd-4cb8-b465-f72fe1f585c2';
    const { data: managerProfile, error: managerError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', managerId)
      .single();

    console.log('👤 Manager profile query:');
    console.log('- Error:', managerError);
    console.log('- Data:', managerProfile);
    console.log('');

    // Test 3: Get specific employee profile
    const employeeId = '39cb09e8'; // partial ID you mentioned
    const { data: employeeProfiles, error: employeeError } = await supabase
      .from('user_profiles')
      .select('*')
      .like('id', employeeId + '%');

    console.log('👥 Employee profile query:');
    console.log('- Error:', employeeError);
    console.log('- Data:', employeeProfiles);

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

testDirectQuery();
