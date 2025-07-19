const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function createTestUsers() {
  console.log('🚀 Creating test users in Supabase...');
  
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

  const testUsers = [
    {
      email: 'manager@example.com',
      password: 'password123',
      fullName: 'Manager User',
      role: 'manager'
    },
    {
      email: 'employee@example.com',
      password: 'password123', 
      fullName: 'Employee User',
      role: 'employee'
    }
  ];

  for (const user of testUsers) {
    try {
      console.log(`\n📝 Creating user: ${user.email}`);

      // Create user in auth.users
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.fullName
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`   ⚠️  User ${user.email} already exists in auth.users`);
          
          // Get existing user ID
          const { data: existingUsers } = await supabase.auth.admin.listUsers();
          const existingUser = existingUsers.users.find(u => u.email === user.email);
          
          if (existingUser) {
            // Check if profile exists
            const { data: existingProfile } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', existingUser.id)
              .single();

            if (!existingProfile) {
              console.log(`   📝 Creating profile for existing user...`);
              const { error: profileError } = await supabase
                .from('user_profiles')
                .insert({
                  id: existingUser.id,
                  full_name: user.fullName,
                  role: user.role,
                  is_active: true
                });

              if (profileError) {
                console.log(`   ❌ Profile creation failed:`, profileError.message);
              } else {
                console.log(`   ✅ Profile created for ${user.email}`);
              }
            } else {
              console.log(`   ✅ Profile already exists for ${user.email}`);
            }
          }
        } else {
          console.log(`   ❌ Auth creation failed:`, authError.message);
        }
        continue;
      }

      console.log(`   ✅ Auth user created: ${authData.user.id}`);

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          full_name: user.fullName,
          role: user.role,
          is_active: true
        });

      if (profileError) {
        console.log(`   ❌ Profile creation failed:`, profileError.message);
      } else {
        console.log(`   ✅ Profile created for ${user.email}`);
      }

    } catch (error) {
      console.log(`   ❌ Failed to create ${user.email}:`, error.message);
    }
  }

  console.log('\n🎯 Testing login after user creation...');
  
  // Test login
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'manager@example.com',
    password: 'password123'
  });

  if (loginError) {
    console.log('❌ Test login failed:', loginError.message);
  } else {
    console.log('✅ Test login successful!');
    console.log('User ID:', loginData.user.id);
    console.log('Email:', loginData.user.email);
  }
}

createTestUsers().catch(console.error);
