const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://agzfvykqwbvgxvjlnhrd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnemZ2eWtxd2J2Z3h2amxuaHJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5MzY5ODUsImV4cCI6MjA1MjUxMjk4NX0.jNUcfHCFXCU-Fqft8MiOl4bO6dMH4Xz_wY3THDgEvac';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixManagerRole() {
  try {
    console.log('🔧 Fixing manager role...\n');

    // First, let's find the manager user by email
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', 'b0e693be'); // Using the partial ID you provided

    if (profileError) {
      console.error('❌ Error getting user profiles:', profileError);
      return;
    }

    console.log('Found profiles:', profiles);

    // Update all users with manager@example.com to have manager role
    const { data: updateData, error: updateError } = await supabase
      .from('user_profiles')
      .update({ role: 'manager' })
      .like('id', 'b0e693be%') // Match the partial ID
      .select();

    if (updateError) {
      console.error('❌ Error updating user role:', updateError);
      return;
    }

    console.log('✅ Successfully updated user role:');
    console.log(updateData);

    // Verify the update
    const { data: verifyData, error: verifyError } = await supabase
      .from('user_profiles')
      .select('*')
      .like('id', 'b0e693be%');

    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError);
      return;
    }

    console.log('🔍 Verification - Updated profile:');
    verifyData.forEach(profile => {
      console.log(`- ${profile.full_name} | Role: ${profile.role} | Active: ${profile.is_active}`);
      console.log(`  Email associated with ID: ${profile.id}`);
    });

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

fixManagerRole();
