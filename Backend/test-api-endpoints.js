const http = require('http');

function testAPI() {
  console.log('🧪 Testing API endpoints...\n');

  // Test health endpoint
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/health',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('📊 Health Check Response:');
      console.log('Status:', res.statusCode);
      console.log('Body:', data);
      console.log('');

      // Test inventory endpoint
      testInventoryEndpoint();
    });
  });

  req.on('error', (error) => {
    console.error('❌ Health check failed:', error);
  });

  req.end();
}

function testInventoryEndpoint() {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/inventory',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('📦 Inventory Endpoint Response:');
      console.log('Status:', res.statusCode);
      console.log('Body:', data);
      
      if (res.statusCode === 200) {
        const result = JSON.parse(data);
        console.log('✅ Inventory endpoint working!');
        console.log('Items count:', result.data?.length || 0);
      } else {
        console.log('⚠️  Inventory endpoint returned non-200 status');
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Inventory test failed:', error);
  });

  req.end();
}

// Wait a moment for server to be fully ready
setTimeout(testAPI, 2000);
