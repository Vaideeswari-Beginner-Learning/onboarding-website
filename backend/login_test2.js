const loginData = JSON.stringify({ email: "vaideedeepu@gmail.com", password: "123" }); // Using the email from the earlier DB check

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
