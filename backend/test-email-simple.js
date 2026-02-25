import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

console.log('--- SMTP Connectivity Test ---');
console.log(`User: ${emailUser || 'MISSING'}`);
console.log(`Pass: ${emailPass ? emailPass.replace(/./g, '*') : 'MISSING'} (${emailPass ? emailPass.length : 0} chars)`);

if (!emailUser || !emailPass) {
    console.error('❌ Error: EMAIL_USER or EMAIL_PASS not found in .env');
    process.exit(1);
}

const cleanPass = emailPass.replace(/\s+/g, '');
if (cleanPass.length !== 16) {
    console.warn(`⚠️ Warning: App Password length is ${cleanPass.length}. Gmail App Passwords should be 16 characters.`);
}

async function testConnection() {
    console.log('\nAttempting to connect to Gmail SMTP...');

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: emailUser,
            pass: cleanPass
        }
    });

    try {
        await transporter.verify();
        console.log('✅ Success! SMTP server is ready to take our messages.');

        console.log('\nTesting a mock email (Sending to yourself)...');
        const info = await transporter.sendMail({
            from: `"SMTP Test" <${emailUser}>`,
            to: emailUser,
            subject: 'Forge India SMTP Test',
            text: 'If you see this, your Gmail SMTP configuration is working perfectly!',
            html: '<b>Success!</b> Your Gmail SMTP configuration is working perfectly!'
        });

        console.log('✅ Email Sent! Message ID:', info.messageId);
    } catch (error) {
        console.error('\n❌ Connection Failed!');
        console.error('Code:', error.code);
        console.error('Response:', error.response);
        console.error('Message:', error.message);

        if (error.code === 'EAUTH') {
            console.error('\nTIP: This is an Authentication error. Check if:');
            console.error('1. You are using an "App Password", NOT your regular Gmail password.');
            console.error('2. "2nd Step Verification" is enabled in your Google Account.');
            console.error('3. The App Password is typed correctly in .env (16 letters, no spaces).');
        }
    }
}

testConnection();
