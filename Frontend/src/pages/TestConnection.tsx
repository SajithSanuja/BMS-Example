import React from 'react';
import { useLoginMutation, useGetCurrentUserQuery } from '../store/api/authApi';
import { useGetInventoryItemsQuery } from '../store/api/inventoryApi';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { API_CONFIG } from '@/config/api';

const TestConnectionPage: React.FC = () => {
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const { data: currentUser, error: userError } = useGetCurrentUserQuery();
  const { data: inventory, error: inventoryError, isLoading: inventoryLoading } = useGetInventoryItemsQuery();

  const handleTestLogin = async () => {
    try {
      const result = await login({
        email: 'manager@example.com',
        password: 'password123'
      }).unwrap();
      
      console.log('Login successful:', result);
      alert('Login successful! Check console for details.');
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed! Check console for details.');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Backend Connection Test</h1>
      
      {/* Backend Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle>🔗 Backend Connection Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Backend URL</Badge>
            <span>{API_CONFIG.API_BASE_URL}/api</span>
          </div>
          
          <Button 
            onClick={handleTestLogin} 
            disabled={isLoggingIn}
            className="w-full"
          >
            {isLoggingIn ? 'Testing Login...' : 'Test Login (manager@example.com)'}
          </Button>
        </CardContent>
      </Card>

      {/* Current User Status */}
      <Card>
        <CardHeader>
          <CardTitle>👤 Current User</CardTitle>
        </CardHeader>
        <CardContent>
          {userError ? (
            <div className="text-red-500">
              <Badge variant="destructive">Error</Badge>
              <p className="mt-2">User not authenticated or backend error</p>
              <pre className="text-xs mt-2 bg-gray-100 p-2 rounded">
                {JSON.stringify(userError, null, 2)}
              </pre>
            </div>
          ) : currentUser ? (
            <div className="space-y-2">
              <Badge variant="default">Authenticated</Badge>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Name:</strong> {currentUser.user.fullName}</div>
                <div><strong>Email:</strong> {currentUser.user.email}</div>
                <div><strong>Role:</strong> {currentUser.user.role}</div>
                <div><strong>Active:</strong> {currentUser.user.isActive ? 'Yes' : 'No'}</div>
              </div>
            </div>
          ) : (
            <div>
              <Badge variant="secondary">Not authenticated</Badge>
              <p className="mt-2">Please login first</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inventory Data */}
      <Card>
        <CardHeader>
          <CardTitle>📦 Inventory Data</CardTitle>
        </CardHeader>
        <CardContent>
          {inventoryError ? (
            <div className="text-red-500">
              <Badge variant="destructive">Error</Badge>
              <p className="mt-2">Failed to fetch inventory</p>
              <pre className="text-xs mt-2 bg-gray-100 p-2 rounded">
                {JSON.stringify(inventoryError, null, 2)}
              </pre>
            </div>
          ) : inventoryLoading ? (
            <div>
              <Badge variant="secondary">Loading...</Badge>
              <p className="mt-2">Fetching inventory data...</p>
            </div>
          ) : inventory ? (
            <div className="space-y-2">
              <Badge variant="default">Success</Badge>
              <p><strong>Items found:</strong> {inventory.data.length}</p>
              <div className="grid gap-2">
                {inventory.data.map((item) => (
                  <div key={item.id} className="border p-2 rounded text-sm">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-gray-600">SKU: {item.sku} | Stock: {item.currentStock}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <Badge variant="secondary">No data</Badge>
              <p className="mt-2">Please authenticate first</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Test Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>🧪 Test Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ol className="list-decimal list-inside space-y-1">
            <li>Click "Test Login" to authenticate with the backend</li>
            <li>Check if the Current User section shows your details</li>
            <li>Verify that Inventory Data loads successfully</li>
            <li>Open browser dev tools to see network requests</li>
            <li>All API calls should go to {API_CONFIG.API_BASE_URL}/api</li>
          </ol>
          
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <strong>Test Credentials:</strong><br />
            Email: manager@example.com<br />
            Password: password123
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestConnectionPage;
