import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, TestTube, RefreshCw, LogOut, LogIn } from 'lucide-react';

const SupabaseAuthTest: React.FC = () => {
  const { user, isAuthenticated, isLoading, error, session, login, logout } = useAuth();
  const [testEmail, setTestEmail] = useState('manager@example.com');
  const [testPassword, setTestPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [isTestingLogin, setIsTestingLogin] = useState(false);

  const testCredentials = [
    { email: 'manager@example.com', password: 'password123', role: 'Manager' },
    { email: 'employee@example.com', password: 'password123', role: 'Employee' },
    { email: 'admin@example.com', password: 'password123', role: 'Admin' },
  ];

  const handleTestLogin = async (email?: string, password?: string) => {
    try {
      setIsTestingLogin(true);
      await login(email || testEmail, password || testPassword);
    } catch (error) {
      console.error('Test login failed:', error);
    } finally {
      setIsTestingLogin(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <TestTube className="h-8 w-8" />
          Supabase Authentication Test
        </h1>
        <p className="text-muted-foreground">
          Test Supabase authentication implementation and session management
        </p>
      </div>

      {/* Auth Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Authentication Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Badge variant={isAuthenticated ? 'default' : 'secondary'}>
                {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">Status</p>
            </div>
            <div className="text-center">
              <Badge variant={isLoading ? 'destructive' : 'outline'}>
                {isLoading ? 'Loading' : 'Ready'}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">State</p>
            </div>
            <div className="text-center">
              <Badge variant={session ? 'default' : 'secondary'}>
                {session ? 'Active Session' : 'No Session'}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">Session</p>
            </div>
            <div className="text-center">
              <Badge variant={error ? 'destructive' : 'outline'}>
                {error ? 'Error' : 'No Errors'}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">Errors</p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-destructive text-sm font-medium">Error:</p>
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Information */}
      {isAuthenticated && user && (
        <Card>
          <CardHeader>
            <CardTitle>Current User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-sm">{user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                <p className="text-sm">{user.fullName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Role</p>
                <Badge variant="outline" className="text-xs">
                  {user.role}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant={user.isActive ? 'default' : 'secondary'} className="text-xs">
                  {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">User ID</p>
                <p className="text-xs font-mono bg-muted p-1 rounded">{user.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Information */}
      {session && (
        <Card>
          <CardHeader>
            <CardTitle>Session Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Access Token</p>
                <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                  {session.access_token.substring(0, 50)}...
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expires At</p>
                <p className="text-sm">{formatDate(new Date(session.expires_at * 1000).toISOString())}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Token Type</p>
                <p className="text-sm">{session.token_type}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Provider</p>
                <p className="text-sm">{session.user.app_metadata.provider || 'email'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Login */}
      {!isAuthenticated && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Test Login
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter test email"
                  disabled={isTestingLogin}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={testPassword}
                    onChange={(e) => setTestPassword(e.target.value)}
                    placeholder="Enter test password"
                    disabled={isTestingLogin}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <Button
                onClick={() => handleTestLogin()}
                disabled={isTestingLogin || !testEmail || !testPassword}
                className="w-full"
              >
                {isTestingLogin ? 'Testing Login...' : 'Test Login'}
              </Button>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium mb-3">Quick Test Credentials:</p>
              <div className="grid gap-2">
                {testCredentials.map((cred, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestLogin(cred.email, cred.password)}
                    disabled={isTestingLogin}
                    className="justify-start"
                  >
                    <Badge variant="secondary" className="mr-2 text-xs">
                      {cred.role}
                    </Badge>
                    {cred.email}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logout */}
      {isAuthenticated && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5" />
              Session Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full"
            >
              Logout
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p><strong>1. Create Test Users:</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Go to your Supabase project dashboard</li>
              <li>Navigate to Authentication → Users</li>
              <li>Click "Add user" and create users with the test credentials above</li>
              <li>Or run the SQL setup script in the SQL editor</li>
            </ul>
            
            <p><strong>2. Test Authentication Flow:</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use the quick test buttons to login with different roles</li>
              <li>Check that user information is displayed correctly</li>
              <li>Refresh the page to test session persistence</li>
              <li>Test logout functionality</li>
            </ul>
            
            <p><strong>3. Verify Session Management:</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Session should persist across page refreshes</li>
              <li>Check browser localStorage for 'bms-supabase-auth-token'</li>
              <li>Verify 12-hour session expiration works</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseAuthTest;
