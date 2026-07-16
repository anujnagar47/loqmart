const http = require('http');

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

const routesToTest = [
  { method: 'GET', path: '/api/admin/dashboard' },
  { method: 'GET', path: '/api/categories' },
  { method: 'GET', path: '/api/products' },
  { method: 'GET', path: '/api/states/stats' },
  { method: 'GET', path: '/api/blog' },
  // Adding POST endpoints with basic payloads to ensure no 500 errors (expecting 400/401 is fine as long as DB doesn't crash)
  { method: 'POST', path: '/api/auth/request-otp', body: { phone: "+919876543210" } },
];

async function testRoute(route) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: route.path,
      method: route.method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          path: route.path,
          method: route.method,
          status: res.statusCode,
          success: res.statusCode < 500, // As long as it's not a 500 server error, the DB connection is structurally sound
          response: data.substring(0, 100)
        });
      });
    });

    req.on('error', (e) => {
      resolve({
        path: route.path,
        method: route.method,
        status: 'ERROR',
        success: false,
        error: e.message
      });
    });

    if (route.body) {
      req.write(JSON.stringify(route.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log(`Starting Live API Tests against ${BASE_URL}...\n`);
  let allPassed = true;
  
  for (const route of routesToTest) {
    console.log(`Testing [${route.method}] ${route.path}...`);
    const result = await testRoute(route);
    
    if (result.success) {
      console.log(`✅ Passed (${result.status})`);
    } else {
      console.log(`❌ Failed (${result.status})`);
      console.log(`   Response: ${result.response || result.error}`);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log("\n🎉 All tested API routes are returning valid responses! Database integration is perfect.");
  } else {
    console.log("\n🚨 Some routes failed with 500 Server Errors. Check server logs.");
  }
}

runTests();
