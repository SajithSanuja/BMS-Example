# Supabase Authentication Implementation Guide

This document outlines the complete Supabase authentication system implemented in the BMS application.

## Overview

The system uses **Supabase Auth** for authentication with the following architecture:
- Frontend: React + Supabase client for direct auth operations
- Backend: Express.js with Supabase middleware for request validation
- Database: Supabase PostgreSQL with `user_profiles` table for extended user data

## Frontend Authentication

### AuthContext Implementation

The `AuthContext` provides:
- Direct Supabase authentication (login, register, logout)
- Automatic session management via `onAuthStateChange`
- Integration with Redux store for state management
- Role-based access control

Key features:
```typescript
// Login with Supabase
const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  // Auto-fetches user profile and updates Redux state
};

// Register with profile creation
const register = async (userData: RegisterData) => {
  const { data, error } = await supabase.auth.signUp({...});
  // Creates user_profiles record automatically
};
```

### API Integration

All API calls automatically include the Supabase JWT token:
```typescript
// apiSlice.ts automatically adds auth headers
prepareHeaders: async (headers) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    headers.set('authorization', `Bearer ${session.access_token}`);
  }
}
```

### Protected Routes

Use `useAuthGuard` hook for protected pages:
```typescript
// Basic authentication required
const { isAuthenticated, user } = useAuthGuard();

// Role-specific access
const { isAuthenticated, user } = useAuthGuard({ 
  requiredRoles: ['admin', 'manager'] 
});

// Convenience hooks
useAdminGuard();      // Admin only
useManagerGuard();    // Admin + Manager
useEmployeeGuard();   // All roles
```

## Backend Authentication

### Auth Middleware

The `authMiddleware` validates every request:
1. Extracts JWT token from `Authorization` header
2. Validates token with Supabase
3. Fetches user profile from `user_profiles` table
4. Attaches user data to `req.user`

```typescript
export const authMiddleware = async (req, res, next) => {
  // Validates Supabase JWT token
  // Fetches user profile with role
  // Attaches to req.user for route access
};
```

### Role-Based Middleware

```typescript
// Apply to routes requiring specific roles
app.use('/admin', requireAdmin);
app.use('/inventory', requireManager);
app.use('/dashboard', requireEmployee);

// Or individual routes
router.post('/items', requireManager, createItem);
```

### Route Protection

All API routes are protected:
```typescript
// inventory.ts
router.use(authMiddleware);  // Apply to all routes
router.post('/', requireManager, createItem);  // Manager+ only
router.get('/', getItems);  // Any authenticated user
```

## Database Schema

### user_profiles Table

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS)

```sql
-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Admins can manage all profiles
CREATE POLICY "Admins can manage profiles" ON user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

## Authentication Flow

### Login Process

1. **Frontend**: User submits credentials
2. **Supabase**: Validates credentials, returns JWT
3. **Frontend**: `onAuthStateChange` triggered
4. **Frontend**: Fetches user profile from `user_profiles`
5. **Frontend**: Updates Redux state with user + session
6. **API Calls**: Auto-include JWT in headers

### Request Validation

1. **Frontend**: Makes API call with JWT in header
2. **Backend**: `authMiddleware` validates JWT with Supabase
3. **Backend**: Fetches user profile for role information
4. **Backend**: Role middleware checks permissions
5. **Backend**: Processes request if authorized

## Role-Based Access Control

### Roles Hierarchy

```
admin     -> Full system access
manager   -> Business operations (inventory, sales, purchasing)
employee  -> Read-only access to assigned modules
```

### Implementation Examples

#### Frontend Protection
```typescript
// Page-level protection
const InventoryPage = () => {
  useManagerGuard(); // Redirects if insufficient access
  return <InventoryContent />;
};

// Component-level protection
{user?.role === 'admin' && <AdminSettings />}
{checkAccess(['admin', 'manager']) && <ManagerActions />}
```

#### Backend Protection
```typescript
// Route-level protection
router.delete('/users/:id', requireAdmin, deleteUser);
router.post('/inventory', requireManager, createInventoryItem);
router.get('/reports', requireEmployee, getReports);
```

## Security Features

### Token Management
- JWT tokens from Supabase (secure, signed)
- Automatic token refresh via Supabase client
- Token validation on every request

### Session Security
- Automatic session cleanup on logout
- Session persistence across browser refreshes
- Secure token storage via Supabase client

### Error Handling
- Detailed error codes for debugging
- Secure error messages for production
- Comprehensive logging for audit trails

### API Security
- All routes require authentication
- Role-based access control
- Request logging with user context
- Rate limiting (can be added)

## Testing Authentication

### Test Users
Create test users with different roles:
```typescript
// Admin user
{ email: 'admin@test.com', role: 'admin' }

// Manager user  
{ email: 'manager@test.com', role: 'manager' }

// Employee user
{ email: 'employee@test.com', role: 'employee' }
```

### Test Scenarios
1. Login with each role
2. Access pages with different role requirements
3. Make API calls with insufficient permissions
4. Test token expiration handling
5. Test logout and session cleanup

## Environment Configuration

### Frontend (.env)
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend (.env)
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Migration from Old Auth

1. **Frontend**: Updated AuthContext to use Supabase directly
2. **Backend**: Enhanced middleware with role-based access
3. **API**: Automatic JWT validation on all routes
4. **Database**: Existing `user_profiles` table compatible
5. **Security**: Enhanced with proper error codes and logging

## Production Considerations

1. **Environment Variables**: Secure storage of Supabase keys
2. **CORS**: Proper CORS configuration for production domains
3. **Rate Limiting**: Add rate limiting middleware
4. **Monitoring**: Monitor authentication failures and suspicious activity
5. **Backup**: Regular backups of user_profiles table
6. **Compliance**: Ensure GDPR/privacy compliance if applicable
