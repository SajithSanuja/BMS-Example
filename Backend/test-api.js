#!/usr/bin/env node

/**
 * Backend Setup Test Script
 * This script tests the basic functionality of the backend API
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

const testSequence = async () => {
  console.log('🚀 Testing Mini ERP Backend API...\n');

  try {
    // 1. Health Check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    console.log('');

    // 2. Test Registration
    console.log('2. Testing user registration...');
    const registrationData = {
      email: 'testmanager@example.com',
      password: 'testpassword123',
      fullName: 'Test Manager',
      role: 'manager'
    };

    try {
      const regResponse = await axios.post(`${BASE_URL}/api/auth/register`, registrationData);
      console.log('✅ Registration successful:', regResponse.data);
    } catch (regError) {
      if (regError.response?.status === 400 && regError.response?.data?.error?.includes('already')) {
        console.log('ℹ️  User already exists, continuing with login test...');
      } else {
        throw regError;
      }
    }
    console.log('');

    // 3. Test Login
    console.log('3. Testing user login...');
    const loginData = {
      email: 'testmanager@example.com',
      password: 'testpassword123'
    };

    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
    console.log('✅ Login successful!');
    const token = loginResponse.data.session.access_token;
    console.log('');

    // 4. Test Protected Route
    console.log('4. Testing protected route (get current user)...');
    const userResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('✅ Protected route works:', userResponse.data.user);
    console.log('');

    // 5. Test Inventory Endpoint
    console.log('5. Testing inventory endpoint...');
    const inventoryResponse = await axios.get(`${BASE_URL}/api/inventory`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('✅ Inventory endpoint works, items count:', inventoryResponse.data.data.length);
    console.log('');

    // 6. Test Logout
    console.log('6. Testing logout...');
    await axios.post(`${BASE_URL}/api/auth/logout`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('✅ Logout successful!');
    console.log('');

    console.log('🎉 All tests passed! Backend is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.log('\n📋 Troubleshooting:');
    console.log('1. Make sure the backend server is running: npm run dev');
    console.log('2. Check your .env configuration in the Backend folder');
    console.log('3. Verify your Supabase database is set up correctly');
    console.log('4. Ensure the database schema has been executed');
  }
};

// Check if axios is available
try {
  testSequence();
} catch (error) {
  console.log('❌ axios not found. Please run: npm install axios');
  console.log('Or test manually with curl commands from the README');
}
