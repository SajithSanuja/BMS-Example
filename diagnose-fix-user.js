const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://agzfvykqwbvgxvjlnhrd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnemZ2eWtxd2J2Z3h2amxuaHJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5MzY5ODUsImV4cCI6MjA1MjUxMjk4NX0.jNUcfHCFXCU-Fqft8MiOl4bO6dMH4Xz_wY3THDgEvac';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseAndFixUserRole() {
  try {
    console.log('🔍 Diagnosing user profile issue...\n');

    // Check user_profiles table directly
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*');

    if (profileError) {
      console.error('❌ Error getting user profiles:', profileError);
      return;
    }

    console.log('👤 All User Profiles:');
    if (profiles && profiles.length > 0) {
      profiles.forEach(profile => {
        console.log(`- ${profile.full_name || 'No Name'} | Role: ${profile.role} | Active: ${profile.is_active}`);
        console.log(`  Email: Looking for manager@example.com`);
        console.log(`  ID: ${profile.id}`);
        console.log('');
      });
    } else {
      console.log('❌ No user profiles found!');
    }

    // Look for the specific user by ID
    const userId = 'b0e693be-29fd-4cb8-b465-f72fe1f585c2';
    console.log(`🔍 Looking for user with ID: ${userId}\n`);

    const { data: specificUser, error: specificError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (specificError) {
      console.log('❌ User profile not found for this ID:', specificError);
      console.log('🛠️  Creating user profile...');
      
      // Create the missing user profile
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          full_name: 'Manager User',
          role: 'manager',
          is_active: true
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating user profile:', createError);
        return;
      }

      console.log('✅ Created new user profile:', newProfile);
    } else {
      console.log('✅ Found user profile:', specificUser);
      
      if (specificUser.role !== 'manager') {
        console.log('🛠️  Updating role to manager...');
        
        const { data: updatedProfile, error: updateError } = await supabase
          .from('user_profiles')
          .update({ role: 'manager' })
          .eq('id', userId)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Error updating user role:', updateError);
          return;
        }

        console.log('✅ Updated user profile:', updatedProfile);
      } else {
        console.log('✅ User already has manager role');
      }
    }

    // Final verification
    console.log('\n🔍 Final verification...');
    const { data: finalCheck, error: finalError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (finalError) {
      console.error('❌ Final check failed:', finalError);
    } else {
      console.log('✅ Final user profile state:');
      console.log(`- Name: ${finalCheck.full_name}`);
      console.log(`- Role: ${finalCheck.role}`);
      console.log(`- Active: ${finalCheck.is_active}`);
      console.log(`- ID: ${finalCheck.id}`);
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

diagnoseAndFixUserRole();
