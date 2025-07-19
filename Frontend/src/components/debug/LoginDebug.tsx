// DEBUG: Login Test Component
// Add this to your Login page temporarily to test the API directly

import React, { useState } from 'react';
import { API_CONFIG } from '@/config/api';

const LoginDebug = () => {
  const [result, setResult] = useState('');

  const testDirectAPI = async () => {
    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'manager@example.com',
          password: 'password123'
        })
      });
      
      const data = await response.json();
      setResult(`✅ Direct API Success: ${data.message}`);
    } catch (error) {
      setResult(`❌ Direct API Error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h3>Login Debug</h3>
      <button onClick={testDirectAPI}>Test Direct API Call</button>
      <div style={{ marginTop: '10px', fontFamily: 'monospace' }}>
        {result}
      </div>
    </div>
  );
};

export default LoginDebug;
