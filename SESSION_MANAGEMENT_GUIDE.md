# Session Management Implementation Guide

## Overview

The authentication system now includes proper session persistence and 12-hour session expiration. This ensures users don't have to log in repeatedly on page reload while maintaining security with automatic session expiration.

## Key Features

### 1. Session Persistence
- **localStorage Storage**: Sessions are stored in browser's localStorage
- **Automatic Restoration**: User sessions are restored on page reload
- **Custom Storage Key**: Uses `bms-supabase-auth-token` for Supabase sessions
- **Metadata Tracking**: Additional session metadata stored for expiration tracking

### 2. 12-Hour Session Expiration
- **Automatic Expiration**: Sessions expire exactly 12 hours after login
- **Periodic Checks**: System checks session expiration every 5 minutes
- **Graceful Logout**: Automatic logout when session expires
- **Clear Notifications**: Console logs for session expiration events

### 3. Enhanced Security
- **Token Refresh**: Automatic token refresh while session is valid
- **Fallback Handling**: Graceful fallback when session operations fail
- **State Synchronization**: Redux state stays in sync with session state

## Technical Implementation

### Session Storage Configuration
```typescript
// Supabase client configuration
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'bms-supabase-auth-token',
  },
});
```

### Session Manager Class
- **SessionManager.store()**: Store session metadata
- **SessionManager.isExpired()**: Check if session is expired
- **SessionManager.clear()**: Clear session data
- **SessionManager.getTimeRemaining()**: Get remaining session time
- **SessionManager.debug()**: Debug session information

### Authentication Flow

#### 1. Login Process
1. User submits credentials
2. Supabase authenticates and returns session
3. Session metadata stored in localStorage
4. User profile fetched and stored in Redux
5. Session expiration timer starts

#### 2. Page Reload Process
1. Check if stored session metadata exists
2. Verify session hasn't expired (12 hours)
3. Get current Supabase session
4. Restore user state if session is valid
5. Clear session if expired and logout

#### 3. Session Expiration
1. Periodic check every 5 minutes
2. Automatic logout when expired
3. Clear all session data
4. Redirect to login (handled by app routing)

## Usage Examples

### Debugging Sessions
```javascript
// In browser console
debugSession(); // Shows detailed session information
```

### Manual Session Management
```typescript
import { SessionManager } from '@/lib/sessionManager';

// Check if session is expired
if (SessionManager.isExpired()) {
  // Handle expired session
}

// Get time remaining
const timeLeft = SessionManager.getTimeRemainingFormatted();
console.log(`Session expires in: ${timeLeft}`);

// Debug session info
SessionManager.debug();
```

## Testing the Implementation

### 1. Login Persistence Test
1. Login to the application
2. Refresh the page multiple times
3. Verify you remain logged in
4. Check browser console for session logs

### 2. Session Expiration Test
1. Login to the application
2. Open browser console and run: `debugSession()`
3. Note the session expiration time
4. Wait for expiration (or modify session start time in localStorage for testing)
5. Verify automatic logout occurs

### 3. Database Test
1. Go to `/auth-test` page
2. Click "Test Database" to verify connection
3. Click "Debug Session" to see session details
4. Check session time remaining in the Authentication Status card

## Configuration

### Session Duration
Default: 12 hours (43200 seconds)
To change: Modify `SESSION_DURATION` in `sessionManager.ts`

### Check Interval
Default: 5 minutes
To change: Modify interval in AuthContext useEffect

### Storage Keys
- Supabase session: `bms-supabase-auth-token`
- Session metadata: `bms_session_metadata`

## Troubleshooting

### Session Not Persisting
1. Check browser localStorage support
2. Verify Supabase client configuration
3. Check for localStorage quota exceeded
4. Verify no browser extensions clearing storage

### Session Expiring Too Early/Late
1. Check system clock accuracy
2. Verify `SESSION_DURATION` configuration
3. Check for manual localStorage modifications
4. Debug session metadata timestamps

### Session Debug Commands
```javascript
// Browser console commands
debugSession();                    // Full session debug info
localStorage.getItem('bms_session_metadata'); // Raw metadata
localStorage.getItem('bms-supabase-auth-token'); // Supabase session
```

## Security Considerations

1. **Client-Side Expiration**: Session expiration is enforced client-side and server-side
2. **Token Refresh**: Automatic token refresh prevents unnecessary logouts
3. **Secure Storage**: localStorage is appropriate for JWTs with proper expiration
4. **No Sensitive Data**: Only session metadata and tokens stored, no passwords
5. **Automatic Cleanup**: All session data cleared on logout/expiration

## Database Requirements

The session management works with the existing Supabase setup. Ensure:
1. `user_profiles` table exists (run `SUPABASE_SETUP.sql`)
2. RLS policies are properly configured
3. Supabase URL and keys are correct in environment

## Browser Compatibility

- **localStorage**: Supported in all modern browsers
- **Supabase**: IE11+ support
- **Session Persistence**: Works across browser tabs
- **Automatic Cleanup**: Handles browser close/crash scenarios
