import fetch from 'node-fetch';

async function testLogin() {
    const url = 'https://onboarding-website-1.onrender.com/api/auth/login';
    console.log(`Testing POST ${url}...`);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@test.com', password: 'test' })
        });
        console.log(`Status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log(`Body: ${text.substring(0, 200)}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

testLogin();
