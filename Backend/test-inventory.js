const http = require('http');

function testAddInventoryItem() {
  console.log('🧪 Testing inventory item creation...');

  // First, let's login to get a token
  const loginData = JSON.stringify({
    email: 'manager@example.com',
    password: 'password123'
  });

  const loginOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };

  console.log('1️⃣ Getting authentication token...');

  const loginReq = http.request(loginOptions, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      if (res.statusCode === 200) {
        const loginResult = JSON.parse(data);
        const token = loginResult.session.access_token;
        console.log('✅ Login successful, token obtained');
        
        // Now test creating an inventory item
        testCreateItem(token);
      } else {
        console.log('❌ Login failed:', data);
      }
    });
  });

  loginReq.on('error', (error) => {
    console.error('❌ Login request failed:', error.message);
  });

  loginReq.write(loginData);
  loginReq.end();
}

function testCreateItem(token) {
  console.log('\n2️⃣ Testing inventory item creation...');

  const itemData = JSON.stringify({
    name: 'Test Item',
    description: 'A test inventory item',
    category: 'Electronics',
    unit_of_measure: 'pieces',
    purchase_cost: 100.00,
    selling_price: 150.00,
    current_stock: 50,
    reorder_level: 10,
    sku: 'TEST-001'
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/inventory',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(itemData),
      'Authorization': `Bearer ${token}`
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('📊 Create Item Response:');
      console.log('Status:', res.statusCode);
      console.log('Body:', data);
      
      if (res.statusCode === 201) {
        console.log('✅ Item created successfully!');
      } else {
        console.log('❌ Item creation failed');
        
        // Let's also test the GET endpoint to see what's there
        testGetInventory(token);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Create item request failed:', error.message);
  });

  req.write(itemData);
  req.end();
}

function testGetInventory(token) {
  console.log('\n3️⃣ Testing inventory retrieval...');

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/inventory',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('📊 Get Inventory Response:');
      console.log('Status:', res.statusCode);
      console.log('Body:', data);
      
      if (res.statusCode === 200) {
        try {
          const result = JSON.parse(data);
          console.log('✅ Inventory retrieved successfully!');
          console.log('Items count:', result.data?.length || 0);
        } catch (e) {
          console.log('Could not parse inventory response');
        }
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Get inventory request failed:', error.message);
  });

  req.end();
}

testAddInventoryItem();
