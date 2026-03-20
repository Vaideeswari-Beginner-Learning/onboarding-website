const https = require('https');

const data = JSON.stringify({
  email: 'info@forgeindiaconnect.com',
  password: 'Forgeindia@09'
});

const options = {
  hostname: 'onboarding-website-1.onrender.com',
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let responseData = '';

  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('Response:', responseData.substring(0, 500));
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
