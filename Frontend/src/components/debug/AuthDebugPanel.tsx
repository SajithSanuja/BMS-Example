import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

const AuthDebugPanel: React.FC = () => {
  const auth = useAuth();
  const reduxAuth = useSelector((state: RootState) => state.auth);

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs font-mono max-w-md z-50">
      <div className="mb-2 text-yellow-400">🐛 Auth Debug Panel</div>
      
      <div className="space-y-1">
        <div>
          <span className="text-blue-400">Context:</span>
          <div className="ml-2">
            <div>isAuth: {auth.isAuthenticated ? '✅' : '❌'}</div>
            <div>isLoading: {auth.isLoading ? '🔄' : '✅'}</div>
            <div>hasUser: {auth.user ? '✅' : '❌'}</div>
            <div>hasSession: {auth.session ? '✅' : '❌'}</div>
            <div>error: {auth.error ? '❌' : '✅'}</div>
          </div>
        </div>
        
        <div>
          <span className="text-green-400">Redux:</span>
          <div className="ml-2">
            <div>isAuth: {reduxAuth.isAuthenticated ? '✅' : '❌'}</div>
            <div>isLoading: {reduxAuth.isLoading ? '🔄' : '✅'}</div>
            <div>hasUser: {reduxAuth.user ? '✅' : '❌'}</div>
            <div>hasToken: {reduxAuth.token ? '✅' : '❌'}</div>
          </div>
        </div>

        {auth.user && (
          <div>
            <span className="text-purple-400">User:</span>
            <div className="ml-2">
              <div>email: {auth.user.email}</div>
              <div>role: {auth.user.role}</div>
            </div>
          </div>
        )}
      </div>
      
      <button 
        onClick={() => {
          console.log('Auth Context:', auth);
          console.log('Redux Auth:', reduxAuth);
          console.log('LocalStorage:', localStorage.getItem('bms-supabase-auth-token'));
        }}
        className="mt-2 bg-blue-600 px-2 py-1 rounded text-white"
      >
        Log Details
      </button>
    </div>
  );
};

export default AuthDebugPanel;
