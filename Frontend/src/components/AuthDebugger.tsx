import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

/**
 * Debug component to show auth state in development
 * Add this to your app temporarily to debug loading issues
 */
export const AuthDebugger: React.FC = () => {
  const auth = useAuth();
  const reduxAuth = useSelector((state: RootState) => state.auth);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 10,
        right: 10,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 9999,
        maxWidth: '300px',
        fontFamily: 'monospace'
      }}
    >
      <h4>🐛 Auth Debug</h4>
      <div><strong>Context Loading:</strong> {auth.isLoading ? '✅' : '❌'}</div>
      <div><strong>Redux Loading:</strong> {reduxAuth.isLoading ? '✅' : '❌'}</div>
      <div><strong>Authenticated:</strong> {auth.isAuthenticated ? '✅' : '❌'}</div>
      <div><strong>Has Session:</strong> {auth.session ? '✅' : '❌'}</div>
      <div><strong>Has User:</strong> {auth.user ? '✅' : '❌'}</div>
      <div><strong>Error:</strong> {auth.error || 'None'}</div>
      <div><strong>User Email:</strong> {auth.user?.email || 'None'}</div>
      
      <button 
        onClick={() => console.log('Auth State:', { auth, reduxAuth })}
        style={{ 
          marginTop: '5px', 
          padding: '2px 5px', 
          fontSize: '10px',
          background: '#007acc',
          border: 'none',
          color: 'white',
          borderRadius: '3px',
          cursor: 'pointer'
        }}
      >
        Log to Console
      </button>
    </div>
  );
};

export default AuthDebugger;
