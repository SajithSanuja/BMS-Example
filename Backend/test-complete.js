const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

class APITester {
  constructor() {
    this.token = null;
  }

  async log(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
    console.log('');
  }

  async testHealthCheck() {
    try {
      this.log('🔍 Testing health check...');
      const response = await axios.get(`${BASE_URL}/health`);
      this.log('✅ Health check passed', response.data);
      return true;
    } catch (error) {
      this.log('❌ Health check failed', error.message);
      return false;
    }
  }

  async testLogin() {
    try {
      this.log('🔐 Testing login...');
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'manager@example.com',
        password: 'password123'
      });
      
      this.token = response.data.session.access_token;
      this.log('✅ Login successful', {
        user: response.data.user,
        token: this.token ? 'Token received' : 'No token'
      });
      return true;
    } catch (error) {
      this.log('❌ Login failed', error.response?.data || error.message);
      return false;
    }
  }

  async testInvalidLogin() {
    try {
      this.log('🔐 Testing invalid login...');
      await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'invalid@example.com',
        password: 'wrongpassword'
      });
      this.log('❌ Invalid login should have failed');
      return false;
    } catch (error) {
      if (error.response?.status === 401) {
        this.log('✅ Invalid login correctly rejected', error.response.data);
        return true;
      }
      this.log('❌ Unexpected error', error.message);
      return false;
    }
  }

  async testGetCurrentUser() {
    try {
      this.log('👤 Testing get current user...');
      const response = await axios.get(`${BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      this.log('✅ Get current user successful', response.data);
      return true;
    } catch (error) {
      this.log('❌ Get current user failed', error.response?.data || error.message);
      return false;
    }
  }

  async testUnauthorizedAccess() {
    try {
      this.log('🚫 Testing unauthorized access...');
      await axios.get(`${BASE_URL}/api/inventory`);
      this.log('❌ Unauthorized access should have failed');
      return false;
    } catch (error) {
      if (error.response?.status === 401) {
        this.log('✅ Unauthorized access correctly blocked', error.response.data);
        return true;
      }
      this.log('❌ Unexpected error', error.message);
      return false;
    }
  }

  async testGetInventory() {
    try {
      this.log('📦 Testing get inventory...');
      const response = await axios.get(`${BASE_URL}/api/inventory`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      this.log('✅ Get inventory successful', {
        itemCount: response.data.data.length,
        items: response.data.data.map(item => ({
          id: item.id,
          name: item.name,
          sku: item.sku,
          stock: item.current_stock
        }))
      });
      return true;
    } catch (error) {
      this.log('❌ Get inventory failed', error.response?.data || error.message);
      return false;
    }
  }

  async testCreateInventoryItem() {
    try {
      this.log('📦 Testing create inventory item...');
      const newItem = {
        name: 'Test Product',
        description: 'Test product for API testing',
        category: 'Test Category',
        unit_of_measure: 'units',
        purchase_cost: 50.00,
        selling_price: 75.00,
        current_stock: 100,
        reorder_level: 10,
        sku: 'TEST-PROD-001'
      };

      const response = await axios.post(`${BASE_URL}/api/inventory`, newItem, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      this.log('✅ Create inventory item successful', response.data);
      return response.data.data.id;
    } catch (error) {
      this.log('❌ Create inventory item failed', error.response?.data || error.message);
      return false;
    }
  }

  async testGetSingleInventoryItem(itemId) {
    try {
      this.log(`📦 Testing get single inventory item (ID: ${itemId})...`);
      const response = await axios.get(`${BASE_URL}/api/inventory/${itemId}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      this.log('✅ Get single inventory item successful', response.data);
      return true;
    } catch (error) {
      this.log('❌ Get single inventory item failed', error.response?.data || error.message);
      return false;
    }
  }

  async testRegisterUser() {
    try {
      this.log('👤 Testing user registration...');
      const newUser = {
        email: `test${Date.now()}@example.com`,
        password: 'testpassword123',
        fullName: 'Test User',
        role: 'employee'
      };

      const response = await axios.post(`${BASE_URL}/api/auth/register`, newUser);
      this.log('✅ User registration successful', response.data);
      return true;
    } catch (error) {
      this.log('❌ User registration failed', error.response?.data || error.message);
      return false;
    }
  }

  async testLogout() {
    try {
      this.log('🚪 Testing logout...');
      const response = await axios.post(`${BASE_URL}/api/auth/logout`, {}, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      this.log('✅ Logout successful', response.data);
      return true;
    } catch (error) {
      this.log('❌ Logout failed', error.response?.data || error.message);
      return false;
    }
  }

  async testNotFoundRoute() {
    try {
      this.log('🔍 Testing 404 route...');
      await axios.get(`${BASE_URL}/api/nonexistent`);
      this.log('❌ 404 route should have failed');
      return false;
    } catch (error) {
      if (error.response?.status === 404) {
        this.log('✅ 404 route correctly handled', error.response.data);
        return true;
      }
      this.log('❌ Unexpected error', error.message);
      return false;
    }
  }

  async runAllTests() {
    console.log('🧪 Mini ERP Backend API Test Suite');
    console.log('=====================================\n');

    const results = [];
    let createdItemId = null;

    // Test sequence
    results.push(await this.testHealthCheck());
    results.push(await this.testLogin());
    results.push(await this.testInvalidLogin());
    
    if (this.token) {
      results.push(await this.testGetCurrentUser());
      results.push(await this.testUnauthorizedAccess());
      results.push(await this.testGetInventory());
      
      createdItemId = await this.testCreateInventoryItem();
      if (createdItemId) {
        results.push(await this.testGetSingleInventoryItem(createdItemId));
      }
      
      results.push(await this.testRegisterUser());
      results.push(await this.testLogout());
    }
    
    results.push(await this.testNotFoundRoute());

    // Summary
    const passed = results.filter(r => r === true).length;
    const total = results.length;
    
    console.log('=====================================');
    console.log(`📊 Test Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('🎉 All tests passed! Backend is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Check the logs above for details.');
    }
    
    console.log('\n🚀 Ready to connect frontend!');
    console.log('Backend is running on http://localhost:5000');
    console.log('Use these test credentials:');
    console.log('  Email: manager@example.com');
    console.log('  Password: password123');
  }
}

// Wait for server to be ready
async function waitForServer() {
  console.log('⏳ Waiting for server to start...');
  for (let i = 0; i < 30; i++) {
    try {
      await axios.get(`${BASE_URL}/health`, { timeout: 1000 });
      console.log('✅ Server is ready!\n');
      return true;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  console.log('❌ Server failed to start within 30 seconds');
  return false;
}

// Run tests
async function main() {
  const serverReady = await waitForServer();
  if (!serverReady) {
    process.exit(1);
  }

  const tester = new APITester();
  await tester.runAllTests();
}

// Handle script execution
if (require.main === module) {
  main().catch(console.error);
}

module.exports = APITester;
