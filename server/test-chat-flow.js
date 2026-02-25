// Native fetch is available in Node.js v18+

const BASE_URL = 'http://localhost:5000/api';
const CANDIDATE_EMAIL = 'test_candidate@example.com';
const ADMIN_EMAIL = 'admin@gmail.com';

async function testChat() {
    console.log('--- Starting Chat Test ---');

    // 1. Candidate sends message to Admin
    console.log('\n1. Candidate sending message...');
    try {
        const res = await fetch(`${BASE_URL}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sender: CANDIDATE_EMAIL,
                senderName: 'Test Candidate',
                receiver: 'admin',
                text: 'Hello Admin, this is a test.'
            })
        });
        const data = await res.json();
        console.log('   Response:', res.status, data);
    } catch (e) {
        console.error('   Error:', e.message);
    }

    // 2. Admin fetches conversation
    console.log('\n2. Admin fetching messages for candidate...');
    try {
        const res = await fetch(`${BASE_URL}/messages/${CANDIDATE_EMAIL}`);
        const data = await res.json();
        console.log('   Response Messages Count:', data.length);
        console.log('   Latest Message:', data[data.length - 1]);
    } catch (e) {
        console.error('   Error:', e.message);
    }

    // 3. Admin replies
    console.log('\n3. Admin replying...');
    try {
        const res = await fetch(`${BASE_URL}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sender: 'admin',
                senderName: 'HR Admin',
                receiver: CANDIDATE_EMAIL,
                text: 'Hello Candidate, received your test.'
            })
        });
        const data = await res.json();
        console.log('   Response:', res.status, data);
    } catch (e) {
        console.error('   Error:', e.message);
    }

    // 4. Admin checks active conversations list
    console.log('\n4. Admin fetching active conversation list...');
    try {
        const res = await fetch(`${BASE_URL}/admin/conversations`);
        const data = await res.json();
        console.log('   Active Conversations:', data);
    } catch (e) {
        console.error('   Error:', e.message);
    }

    console.log('\n--- Test Complete ---');
}

testChat();
