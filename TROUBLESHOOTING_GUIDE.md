# Authentication Issue Troubleshooting Guide

## Current Status
✅ **Server Running**: http://localhost:5173/
✅ **Enhanced Logging**: Added comprehensive console logging
✅ **Session Management**: Fixed logic issues with SessionManager

## Step-by-Step Testing Process

### 1. Open Browser Console
1. Open http://localhost:5173/ in your browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. Look for authentication logs starting with 🔄, ✅, ❌, etc.

### 2. Clear Previous Session Data
```javascript
// Run in browser console to clear all auth data
localStorage.clear();
location.reload();
```

### 3. Test Database Setup
1. Go to http://localhost:5173/auth-test
2. Click "Test Database" button
3. Check if user_profiles table exists
4. If it fails, you need to run `SUPABASE_SETUP.sql`

### 4. Test Registration (if no users exist)
1. Go to registration form on auth-test page
2. Create a test user:
   - Email: test@example.com
   - Password: password123
   - Full Name: Test User
   - Role: admin
3. Watch console logs for registration process

### 5. Test Login
1. Use the credentials from step 4
2. Watch console logs for login process
3. Look for these specific log messages:
   - 🔐 Attempting login for: [email]
   - ✅ Login successful, waiting for onAuthStateChange...
   - 👤 Handling auth user: [email]
   - 🎯 Setting user credentials: [details]

### 6. Test Session Persistence
1. After successful login, refresh the page
2. Watch console logs for:
   - 🔄 Initializing authentication...
   - 📋 Session check result: [details]
   - ✅ Session is valid, restoring user...
   - 🏁 Auth initialization complete

### 7. Test Session Expiration
```javascript
// In browser console, debug session info
debugSession();

// To test expiration quickly (modify session start time)
let metadata = JSON.parse(localStorage.getItem('bms_session_metadata'));
metadata.sessionStart = Math.floor(Date.now() / 1000) - 43201; // 12 hours + 1 second ago
localStorage.setItem('bms_session_metadata', JSON.stringify(metadata));
location.reload(); // Should auto-logout
```

## Common Issues and Solutions

### Issue 1: "Failed to fetch user profile"
**Symptoms**: Error on login, infinite loading
**Solution**: Run database setup script

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the entire `SUPABASE_SETUP.sql` file
4. Click "Run"

### Issue 2: Login works but logout on page refresh
**Symptoms**: Console shows "❌ No session found"
**Possible Causes**:
1. Supabase URL/keys incorrect
2. Browser blocking localStorage
3. Network issues

**Debug Steps**:
```javascript
// Check Supabase config
console.log('Supabase URL:', 'https://oyzsgcwjrfjudiopdnam.supabase.co');

// Check localStorage
console.log('Supabase token:', localStorage.getItem('bms-supabase-auth-token'));
console.log('Session metadata:', localStorage.getItem('bms_session_metadata'));
```

### Issue 3: Session expires immediately
**Symptoms**: Automatic logout right after login
**Check**: Look for "⏰ Stored session expired" in console
**Solution**: Clear localStorage and try again

### Issue 4: Infinite loading state
**Symptoms**: Loading spinner never disappears
**Debug**: Check Redux state
```javascript
// Check Redux auth state (if Redux DevTools available)
// Or check the loading state in AuthTestPage
```

## Environment Check

### Required Environment Variables
Check your `.env` file has:
```
VITE_SUPABASE_URL=https://oyzsgcwjrfjudiopdnam.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Browser Requirements
- localStorage enabled
- JavaScript enabled
- No aggressive ad blockers
- No privacy extensions blocking storage

## Debug Commands

### Browser Console Commands
```javascript
// Session debugging
debugSession();

// Check all auth-related localStorage
Object.keys(localStorage).filter(key => 
  key.includes('supabase') || key.includes('bms')
).forEach(key => 
  console.log(key + ':', localStorage.getItem(key))
);

// Clear all auth data
localStorage.removeItem('bms-supabase-auth-token');
localStorage.removeItem('bms_session_metadata');
location.reload();

// Test Supabase connection
fetch('https://oyzsgcwjrfjudiopdnam.supabase.co/rest/v1/', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95enNnY3dqcmZqdWRpb3BkbmFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjU2NTUsImV4cCI6MjA2ODM0MTY1NX0.O8W4ic8594QbZ1jyzMcFjd920ezaAq8D9LAa0Znld70'
  }
}).then(r => console.log('Supabase connection:', r.ok));
```

## Expected Console Log Flow

### Successful Login Flow:
```
🔐 Attempting login for: test@example.com
✅ Login successful, waiting for onAuthStateChange...
Auth state change: SIGNED_IN test@example.com
👤 Handling auth user: test@example.com
✅ Found existing user profile
🎯 Setting user credentials: {email: "test@example.com", role: "admin"}
```

### Successful Page Reload Flow:
```
🔄 Initializing authentication...
📋 Session check result: {hasSession: true, userId: "...", email: "test@example.com", hasMetadata: true}
✅ Session is valid, restoring user...
👤 Handling auth user: test@example.com
✅ Found existing user profile
🎯 Setting user credentials: {email: "test@example.com", role: "admin"}
🏁 Auth initialization complete
```

## Next Steps
1. Follow the testing process above
2. Share the console logs you see
3. Report which specific step fails
4. Check if database setup is needed

The enhanced logging will help identify exactly where the authentication flow is failing.
