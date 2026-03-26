const loginData = JSON.stringify({ email: "admin@gmail.com", password: "admin" });

async function testLogin(url) {
  try {
    const res = await fetch(url + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: loginData
    });
    console.log(`[${url}] STATUS: ${res.status}`);
    const text = await res.text();
    console.log(`[${url}] BODY: ${text}`);
  } catch(e) { console.error(`[${url}] ERROR:`, e.message); }
}

testLogin('http://localhost:5001');
testLogin('https://onboarding-website.onrender.com');
