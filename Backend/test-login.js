const http = require('http');

function testLogin() {
  const postData = JSON.stringify({
    email: 'manager@example.com',
    password: 'password123'
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('🧪 Testing login with credentials:');
  console.log('Email: manager@example.com');
  console.log('Password: password123');
  console.log('');

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('📊 Login Response:');
      console.log('Status:', res.statusCode);
      console.log('Body:', data);
      
      if (res.statusCode === 200) {
        console.log('✅ Login successful!');
        try {
          const result = JSON.parse(data);
          console.log('User:', result.user);
          console.log('Token:', result.session?.access_token?.substring(0, 20) + '...');
        } catch (e) {
          console.log('Could not parse response as JSON');
        }
      } else {
        console.log('❌ Login failed');
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request failed:', error.message);
    console.log('');
    console.log('💡 Make sure the backend server is running on port 5000');
    console.log('   Run: cd Backend && npm start');
  });

  req.write(postData);
  req.end();
}

testLogin();
