import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

const UserDebugger: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated || !user) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50">
        <h3 className="font-bold">🚫 Not Authenticated</h3>
        <p>No user data available</p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
      <h3 className="font-bold mb-2">👤 User Debug Info</h3>
      <div className="text-sm space-y-1">
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Name:</strong> {user.fullName}</p>
        <p><strong>Role:</strong> <span className="bg-yellow-400 text-black px-1 rounded">{user.role}</span></p>
        <p><strong>Active:</strong> {user.isActive ? '✅' : '❌'}</p>
        <p><strong>ID:</strong> {user.id.substring(0, 8)}...</p>
      </div>
    </div>
  );
};

export default UserDebugger;
