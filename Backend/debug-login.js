const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function debugLogin() {
  console.log('🔍 Debugging login process...');
  
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
    // Step 1: Try login
    console.log('\n1️⃣ Testing Supabase auth login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'manager@example.com',
      password: 'password123'
    });

    if (authError) {
      console.log('❌ Auth failed:', authError.message);
      return;
    }

    console.log('✅ Auth successful!');
    console.log('User ID:', authData.user.id);
    console.log('Email:', authData.user.email);

    // Step 2: Check if profile exists
    console.log('\n2️⃣ Looking for user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.log('❌ Profile lookup failed:', profileError.message);
      
      // Check all profiles
      console.log('\n📋 All profiles in database:');
      const { data: allProfiles } = await supabase
        .from('user_profiles')
        .select('*');
      
      console.log(allProfiles);
      
      // Try to create profile if it doesn't exist
      console.log('\n🔧 Creating missing profile...');
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          full_name: 'Manager User',
          role: 'manager',
          is_active: true
        })
        .select()
        .single();

      if (createError) {
        console.log('❌ Profile creation failed:', createError.message);
      } else {
        console.log('✅ Profile created:', newProfile);
      }
    } else {
      console.log('✅ Profile found:', profile);
    }

  } catch (error) {
    console.log('❌ Debug failed:', error.message);
  }
}

debugLogin().catch(console.error);
