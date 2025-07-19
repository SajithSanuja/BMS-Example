import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AuthResetTest: React.FC = () => {
  const { logout } = useAuth();

  const handleClearAll = () => {
    // Clear localStorage
    localStorage.clear();
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Force logout
    logout();
    
    // Reload page
    window.location.reload();
  };

  const handleLoginTest = async () => {
    // Navigate to login page
    window.location.href = '/login';
  };

  return (
    <div className="container mx-auto p-6 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>🔧 Auth Reset & Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use these tools to reset authentication state and test the login flow.
          </p>
          
          <Button 
            onClick={handleClearAll}
            variant="destructive"
            className="w-full"
          >
            🗑️ Clear All Storage & Reset
          </Button>
          
          <Button 
            onClick={handleLoginTest}
            variant="outline"
            className="w-full"
          >
            🔐 Go to Login Page
          </Button>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Steps to test:</strong></p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Click "Clear All Storage & Reset"</li>
              <li>Go to login page</li>
              <li>Login with: manager@example.com / password123</li>
              <li>After login, refresh the page</li>
              <li>Check if fields remain enabled</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthResetTest;
