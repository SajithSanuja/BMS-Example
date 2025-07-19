const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://agzfvykqwbvgxvjlnhrd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnemZ2eWtxd2J2Z3h2amxuaHJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5MzY5ODUsImV4cCI6MjA1MjUxMjk4NX0.jNUcfHCFXCU-Fqft8MiOl4bO6dMH4Xz_wY3THDgEvac';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserRole() {
  try {
    console.log('🔍 Checking user roles...\n');

    // Check all users in auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error getting auth users:', authError);
      return;
    }

    console.log('📋 Auth Users:');
    authUsers.users.forEach(user => {
      console.log(`- ${user.email} (ID: ${user.id})`);
    });
    console.log('');

    // Check all user profiles
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*');

    if (profileError) {
      console.error('❌ Error getting user profiles:', profileError);
      return;
    }

    console.log('👤 User Profiles:');
    if (profiles && profiles.length > 0) {
      profiles.forEach(profile => {
        console.log(`- ${profile.full_name} | Role: ${profile.role} | Active: ${profile.is_active}`);
        console.log(`  ID: ${profile.id}`);
      });
    } else {
      console.log('❌ No user profiles found!');
    }
    console.log('');

    // Specifically check for manager@example.com
    const managerUser = authUsers.users.find(user => user.email === 'manager@example.com');
    if (managerUser) {
      console.log('🔍 Manager User Details:');
      console.log(`- Email: ${managerUser.email}`);
      console.log(`- ID: ${managerUser.id}`);
      console.log(`- Created: ${managerUser.created_at}`);
      
      // Find corresponding profile
      const managerProfile = profiles?.find(profile => profile.id === managerUser.id);
      if (managerProfile) {
        console.log(`- Profile Role: ${managerProfile.role}`);
        console.log(`- Profile Active: ${managerProfile.is_active}`);
        console.log(`- Full Name: ${managerProfile.full_name}`);
      } else {
        console.log('❌ No profile found for manager user!');
      }
    } else {
      console.log('❌ manager@example.com not found in auth users!');
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkUserRole();
