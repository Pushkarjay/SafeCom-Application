const https = require('https');

const BASE_URL = 'https://safecom-backend-177425757120.asia-south1.run.app/api';

function testEndpoint(path) {
  return new Promise((resolve) => {
    const req = https.get(`${BASE_URL}${path}`, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ path, status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300 });
      });
    });
    req.on('error', (e) => resolve({ path, status: 'ERROR', ok: false, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ path, status: 'TIMEOUT', ok: false }); });
  });
}

async function runTests() {
  const endpoints = [
    '/catalog-public/products',
    '/catalog-public/services', 
    '/catalog-public/accessories',
    '/catalog-public/pricing/installation',
    '/catalog-public/upgrade',
    '/catalog-public/pricing/amc',
    '/catalog-public/pricing/maintenance',
    '/catalog-public/pricing/repair',
    '/catalog/services',
    '/catalog/recommendations',
    '/jobs',
    '/bookings',
    '/employees',
    '/customers'
  ];
  
  console.log('Testing API Endpoints...\n');
  for (const ep of endpoints) {
    const result = await testEndpoint(ep);
    console.log(`${result.ok ? '✓' : '✗'} ${result.path}: ${result.status}`);
  }
}

runTests();