import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuthGuard, useAdminGuard, useManagerGuard } from '@/hooks/useAuthGuard';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { SessionManager } from '@/lib/sessionManager';

const AuthTestPage: React.FC = () => {
  const { user, isAuthenticated, login, logout, register, session, isLoading, error } = useAuth();
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ 
    email: '', 
    password: '', 
    fullName: '', 
    role: 'employee' as 'admin' | 'manager' | 'employee' 
  });
  const [dbTestResult, setDbTestResult] = useState<string>('');
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<string>('');

  // Update session time every minute
  useEffect(() => {
    const updateSessionTime = () => {
      if (isAuthenticated) {
        setSessionTimeRemaining(SessionManager.getTimeRemainingFormatted());
      } else {
        setSessionTimeRemaining('');
      }
    };

    updateSessionTime();
    const interval = setInterval(updateSessionTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Test database connectivity
  const testDatabase = async () => {
    try {
      setDbTestResult('Testing database connection...');
      
      // Test 1: Check if user_profiles table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('user_profiles' as any)
        .select('count')
        .limit(1);

      if (tableError) {
        setDbTestResult(`❌ Database Error: ${tableError.message}\n\nThis usually means the user_profiles table doesn't exist. Please run the SUPABASE_SETUP.sql script in your Supabase SQL Editor.`);
        return;
      }

      // Test 2: Check current user profile
      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles' as any)
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          setDbTestResult(`❌ Profile Error: ${profileError.message}\n\nYour user exists but no profile found in user_profiles table.`);
          return;
        }

        setDbTestResult(`✅ Database Connection: OK\n✅ Table Exists: user_profiles\n✅ User Profile: Found\n\nProfile Data:\n${JSON.stringify(profileData, null, 2)}`);
      } else {
        setDbTestResult(`✅ Database Connection: OK\n✅ Table Exists: user_profiles\n⚠️ No user logged in to test profile`);
      }
    } catch (err: any) {
      setDbTestResult(`❌ Unexpected Error: ${err.message}`);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(loginForm.email, loginForm.password);
      toast.success('Login successful!');
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(registerForm);
      toast.success('Registration successful!');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (err: any) {
      toast.error(err.message || 'Logout failed');
    }
  };

  // Test different access levels
  const AdminOnlySection = () => {
    const { hasAccess } = useAdminGuard();
    if (!hasAccess) return null;
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">🔴 Admin Only Section</CardTitle>
        </CardHeader>
        <CardContent>
          <p>You have admin access! This section is only visible to admins.</p>
        </CardContent>
      </Card>
    );
  };

  const ManagerOnlySection = () => {
    const { hasAccess } = useManagerGuard();
    if (!hasAccess) return null;
    return (
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="text-orange-600">🟠 Manager+ Section</CardTitle>
        </CardHeader>
        <CardContent>
          <p>You have manager or admin access! This section is visible to managers and admins.</p>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">🔐 Supabase Authentication Test</h1>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      {/* Authentication Status */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={isAuthenticated ? "default" : "secondary"}>
              {isAuthenticated ? "✅ Authenticated" : "❌ Not Authenticated"}
            </Badge>
          </div>

          {user && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>ID:</strong> {user.id}</div>
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>Full Name:</strong> {user.fullName}</div>
              <div><strong>Role:</strong> <Badge>{user.role}</Badge></div>
              <div><strong>Active:</strong> {user.isActive ? "Yes" : "No"}</div>
              <div><strong>Session Expires:</strong> 
                <Badge variant={sessionTimeRemaining === 'Expired' ? 'destructive' : 'secondary'}>
                  {sessionTimeRemaining || 'Unknown'}
                </Badge>
              </div>
            </div>
          )}

          {session && (
            <div className="text-sm">
              <strong>Session:</strong>
              <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                <div>Access Token: {session.access_token.substring(0, 50)}...</div>
                <div>Expires: {new Date(session.expires_at! * 1000).toLocaleString()}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Database Test Section */}
      <Card>
        <CardHeader>
          <CardTitle>🗄️ Database Connection Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={testDatabase} variant="outline" size="sm">
              Test Database
            </Button>
            <Button onClick={() => SessionManager.debug()} variant="outline" size="sm">
              Debug Session
            </Button>
          </div>
          {dbTestResult && (
            <div className="p-3 bg-gray-100 rounded-md text-sm font-mono whitespace-pre-wrap">
              {dbTestResult}
            </div>
          )}
          <div className="text-xs text-gray-600">
            <p>This test checks if:</p>
            <ul className="list-disc ml-4 mt-1">
              <li>Supabase connection is working</li>
              <li>user_profiles table exists</li>
              <li>Your user profile exists (if logged in)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {!isAuthenticated ? (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Login Form */}
          <Card>
            <CardHeader>
              <CardTitle>Login</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    placeholder="manager@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="password123"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
              </form>

              <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
                <strong>Test Credentials:</strong><br />
                Email: manager@example.com<br />
                Password: password123
              </div>
            </CardContent>
          </Card>

          {/* Register Form */}
          <Card>
            <CardHeader>
              <CardTitle>Register</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="register-name">Full Name</Label>
                  <Input
                    id="register-name"
                    value={registerForm.fullName}
                    onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="register-role">Role</Label>
                  <select
                    id="register-role"
                    value={registerForm.role}
                    onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value as any })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Registering...' : 'Register'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Logout */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={handleLogout} variant="outline">
                Logout
              </Button>
            </CardContent>
          </Card>

          {/* Role-based content */}
          <div className="space-y-4">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-green-600">🟢 All Users Section</CardTitle>
              </CardHeader>
              <CardContent>
                <p>This section is visible to all authenticated users.</p>
              </CardContent>
            </Card>

            <ManagerOnlySection />
            <AdminOnlySection />
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthTestPage;
