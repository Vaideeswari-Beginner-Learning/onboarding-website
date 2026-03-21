import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import os from 'os';
import Candidate from './models/Candidate.js';
import Message from './models/Message.js';
import { getTransporter, resetTransporter, sendAutomaticOfferEmail } from './utils/mailer.js';
import { handleAutomatedOnboarding } from './controllers/onboardingController.js';
import jwt from 'jsonwebtoken';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to verify JWT Token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Access Denied: No Token Provided' });

    console.log(`DEBUG: Verifying Token. Secret length: ${JWT_SECRET.length}`);
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('DEBUG: JWT Verification Failed:', err.message);
            return res.status(403).json({ message: 'Access Denied: Invalid or Expired Token' });
        }
        req.user = user;
        next();
    });
};

// Middleware to verify Admin Role
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access Denied: Admin privileges required' });
    }
};

console.log(`Starting server... CWD: ${process.cwd()}`);
console.log(`DEPLOYMENT SUCCESS v2.0 - CORS FIXED`);
console.log(`PORT: ${PORT}`);

// MANUAL CORS - Force Allow All
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    res.header("Access-Control-Allow-Credentials", "true");

    // Intercept OPTIONS method
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});
// app.use(cors()); // Disable package for now to be absolutely sure

app.use(express.json({ limit: '10mb' }));
app.use("/files", express.static(path.join(process.cwd(), "public")));

// ----------------------------------------

// Root Route
app.get('/', (req, res) => {
    res.json({
        message: "Forge India Connect Onboarding API is running",
        documentation: "/api/health-check",
        status: "Online"
    });
});

// Health Check Endpoint
app.get('/api/health-check', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    res.json({
        status: 'ok',
        version: '2.0.3-FINAL',
        database: dbStatus,
        message: dbStatus === 'Connected' ? 'System fully operational' : 'Database connection pending/failed',
        timestamp: new Date().toISOString()
    });
});

// System Info for Mobile Testing & Mailer Status
app.get('/api/system-info', (req, res) => {
    const interfaces = os.networkInterfaces();
    let localIp = 'localhost';
    const host = req.get('host') || '';

    if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
        for (const devName in interfaces) {
            const iface = interfaces[devName];
            for (let i = 0; i < iface.length; i++) {
                const alias = iface[i];
                if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                    localIp = alias.address;
                    break;
                }
            }
            if (localIp !== 'localhost') break;
        }
    }

    const mailerUser = process.env.EMAIL_USER;
    const mailerPass = process.env.EMAIL_PASS;
    const mailerService = process.env.EMAIL_SERVICE || 'gmail';
    const isMailerConfigured = mailerUser && mailerPass && !mailerUser.includes('your-') && !mailerPass.includes('paste-');

    res.json({
        suggestedUrl: `http://${localIp}:${PORT}`,
        mailerConfigured: !!isMailerConfigured,
        mailerUser: isMailerConfigured ? mailerUser : 'Not Configured',
        mailerService
    });
});

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
    console.error('CRITICAL WARNING: MONGO_URI is not defined!');
} else {
    mongoose.set('bufferCommands', false); // Disable buffering so errors are immediate
    mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000, // Fail fast (5s) if cannot reach server
    })
        .then(() => console.log('✅ MongoDB Connected Successfully'))
        .catch(err => {
            console.error('❌ MongoDB Connection Error:', err.message);
            if (err.message.includes('Authentication failed')) {
                console.error('👉 TIP: Check your MONGO_URI username and password in .env');
            }
        });
}

// Middleware to log requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin}`);
    next();
});

// Routes

// Admin Login
app.post('/api/auth/login', (req, res) => {
    try {
        let { email, password } = req.body;

        // Trim inputs to prevent whitespace-related failures
        email = email ? email.trim() : '';
        password = password ? password.trim() : '';

        console.log(`Login attempt: '${email}'`);

        const isAdminUser = (email === 'info@forgeindiaconnect.com' && password === 'Forgeindia@09') ||
            (email === 'info@gmail.com' && password === 'Forgeindia@09') ||
            (email === 'admin@gmail.com' && password === 'admin');

        if (isAdminUser) {
            const token = jwt.sign(
                { id: 'ADMIN-001', email: email, role: 'admin' },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                token,
                user: {
                    id: 'ADMIN-001',
                    name: 'Admin',
                    email: email,
                    role: 'admin'
                }
            });
        } else {
            console.log('Credentials did not match.');
            res.status(401).json({ message: 'Invalid Admin Credentials' });
        }
    } catch (error) {
        console.error('Login Route Error:', error);
        res.status(500).json({ message: 'Internal Server Error during login' });
    }
});

// Candidate Send OTP (Mock)
app.post('/api/auth/otp/send', (req, res) => {
    const { email } = req.body;
    console.log(`Sending OTP to ${email}`);
    // In a real app, send email/SMS here.
    res.json({ message: 'OTP sent successfully' });
});

// Candidate Direct Login (No OTP)
app.post('/api/auth/candidate/login', async (req, res) => {
    const { email } = req.body;
    try {
        // Check if candidate exists
        let candidate = await Candidate.findOne({ email });

        if (!candidate) {
            // Auto-register if not found
            candidate = new Candidate({
                id: 'CAND-' + Math.random().toString(36).substr(2, 9),
                name: email.split('@')[0], // Use default from email
                email: email,
                role: 'candidate',
                status: 'Onboarding',
                date: new Date().toISOString().split('T')[0],
                documents: []
            });
            await candidate.save();
        }

        const token = jwt.sign(
            { id: candidate.id, email: candidate.email, role: 'candidate' },
            JWT_SECRET,
            { expiresIn: '720h' } // 30 days for candidates
        );

        res.json({ token, user: candidate });
    } catch (error) {
        console.error('Candidate Login Error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Candidate Register
app.post('/api/auth/register', async (req, res) => {
    const { name, email, phone, password } = req.body;

    try {
        // Find existing user
        let candidate = await Candidate.findOne({ email });

        if (candidate) {
            console.log(`🔄 Re-registering existing user: ${email}. Resetting status for testing.`);
            candidate.name = name;
            candidate.phone = phone;
            candidate.password = password;
            candidate.status = 'Onboarding';
            candidate.documents = []; // Clear for reset
            await candidate.save();
            return res.json({ user: candidate, message: 'Account reset for testing' });
        }

        const newCandidate = new Candidate({
            id: 'CAND-' + Math.random().toString(36).substr(2, 9),
            name,
            email,
            phone,
            password,
            role: 'candidate',
            status: 'Onboarding',
            date: new Date().toISOString().split('T')[0],
            documents: []
        });

        await newCandidate.save();
        res.json({ user: newCandidate });
    } catch (error) {
        console.error('❌ REGISTRATION ERROR DETAILED:', error);
        res.status(500).json({ 
            message: 'Server error during registration', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// --- Automatic Onboarding & Email Flow ---
app.post('/api/onboard', handleAutomatedOnboarding);

// Candidate Verify OTP & Login
app.post('/api/auth/otp/verify', async (req, res) => {
    const { email, otp } = req.body;

    // Allow any 4-digit OTP for demo
    if (otp && otp.length === 4) {
        try {
            // Check if candidate exists, if not register them
            let candidate = await Candidate.findOne({ email });

            if (!candidate) {
                // Auto-create if not found (fallback for OTP login without register)
                candidate = new Candidate({
                    id: 'CAND-' + Math.random().toString(36).substr(2, 9),
                    name: email.split('@')[0],
                    email: email,
                    role: 'candidate',
                    status: 'Onboarding',
                    date: new Date().toISOString().split('T')[0],
                    documents: []
                });
                await candidate.save();
            }

            const token = jwt.sign(
                { id: candidate.id, email: candidate.email, role: 'candidate' },
                JWT_SECRET,
                { expiresIn: '720h' }
            );

            res.json({ token, user: candidate });
        } catch (error) {
            console.error('OTP Verification Error:', error);
            res.status(500).json({ message: 'Server error during verification' });
        }
    } else {
        res.status(400).json({ message: 'Invalid OTP' });
    }
});

// Candidate Update Details
app.put('/api/candidates/update', authenticateToken, async (req, res) => {
    const { email, ...updateData } = req.body;

    try {
        // RBAC Check: Only Admin or the Candidate themselves can update this profile
        if (req.user.role !== 'admin' && req.user.email !== email) {
            return res.status(403).json({ message: 'Access Denied: You can only update your own profile' });
        }


        const candidate = await Candidate.findOneAndUpdate(
            { email },
            { $set: updateData },
            { new: true } // Return updated document
        );

        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }

        res.json({ user: candidate, message: 'Details updated successfully' });
    } catch (error) {
        console.error('Update Error:', error);
    }
});

// Request Offer Letter (Candidate)
app.post('/api/candidates/request-offer', authenticateToken, async (req, res) => {
    const { email } = req.body;
    try {
        // RBAC Check: Only Admin or the Candidate themselves can request
        if (req.user.role !== 'admin' && req.user.email !== email) {
            return res.status(403).json({ message: 'Access Denied: Unauthorized request' });
        }


        const candidate = await Candidate.findOneAndUpdate(
            { email },
            {
                $set: {
                    offerLetterRequested: true,
                    offerLetterStatus: 'Requested'
                }
            },
            { new: true }
        );
        res.json({ success: true, candidate });
    } catch (error) {
        console.error('Request Offer Error:', error);
        res.status(500).json({ message: 'Error requesting offer letter' });
    }
});

// Generate Offer Letter (Admin)
app.post('/api/admin/generate-offer', authenticateToken, isAdmin, async (req, res) => {
    const { candidateId, offerDetails } = req.body;
    try {
        const candidate = await Candidate.findByIdAndUpdate(
            candidateId,
            {
                $set: {
                    offerLetterStatus: 'Generated',
                    offerDetails: offerDetails
                    // potentially store generated PDF URL here later
                }
            },
            { new: true }
        );
        res.json({ success: true, candidate });
    } catch (error) {
        console.error('Generate Offer Error:', error);
        res.status(500).json({ message: 'Error generating offer letter' });
    }
});

// Get Candidates (for Admin)
app.get('/api/candidates', authenticateToken, isAdmin, async (req, res) => {
    try {
        const candidates = await Candidate.find({ role: 'candidate' });
        res.json(candidates);
    } catch (error) {
        console.error('Fetch Candidates Error:', error);
        res.status(500).json({ message: 'Server error fetching candidates' });
    }
});

// Get Single Candidate by ID
app.get('/api/candidates/:id', authenticateToken, async (req, res) => {
    try {
        const candidate = await Candidate.findOne({
            $or: [
                { _id: mongoose.isValidObjectId(req.params.id) ? req.params.id : null },
                { id: req.params.id }
            ]
        });

        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }

        // RBAC Check: Only Admin or the Candidate themselves can view this profile
        if (req.user.role !== 'admin' && req.user.email !== candidate.email && req.user.id !== candidate.id && req.user.id !== candidate._id.toString()) {
            return res.status(403).json({ message: 'Access Denied: You can only view your own profile' });
        }

        res.json(candidate);
    } catch (error) {
        console.error('Fetch Candidate Error:', error);
        res.status(500).json({ message: 'Server error fetching candidate' });
    }
});

// Delete Candidate
app.delete('/api/candidates/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const candidate = await Candidate.findOneAndDelete({
            $or: [
                { _id: mongoose.isValidObjectId(req.params.id) ? req.params.id : null },
                { id: req.params.id }
            ]
        });

        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }

        // Also delete associated messages? Optional, but good practice.
        // await Message.deleteMany({ $or: [{ sender: candidate.email }, { receiver: candidate.email }] });

        res.json({ message: 'Candidate deleted successfully' });
    } catch (error) {
        console.error('Delete Candidate Error:', error);
        res.status(500).json({ message: 'Server error deleting candidate' });
    }
});

// Reset Candidate Onboarding (for Demo)
app.post('/api/admin/reset-candidate/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const candidate = await Candidate.findOne({
            $or: [
                { _id: mongoose.isValidObjectId(req.params.id) ? req.params.id : null },
                { id: req.params.id }
            ]
        });

        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }

        // Reset all fields
        candidate.status = 'Onboarding';
        candidate.documents = [];
        candidate.offerLetterRequested = false;
        candidate.offerLetterStatus = 'Pending';
        candidate.offerDetails = {};
        candidate.offerPdfBase64 = null;

        await candidate.save();
        res.json({ message: 'Candidate onboarding reset successfully', candidate });
    } catch (error) {
        console.error('Reset Candidate Error:', error);
        res.status(500).json({ message: 'Server error resetting candidate' });
    }
});

// Retention Policy Check (90 Days)
app.get('/api/admin/check-retention', authenticateToken, isAdmin, async (req, res) => {
    try {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        // Find candidates joined/created more than 90 days ago AND have documents
        const expiredCandidates = await Candidate.find({
            createdAt: { $lt: ninetyDaysAgo },
            documents: { $not: { $size: 0 } }
        });

        let clearedCount = 0;
        for (const candidate of expiredCandidates) {
            candidate.documents = []; // Clear documents
            await candidate.save();
            clearedCount++;
        }

        // Warning Logic (e.g., candidates > 83 days)
        const warningDaysAgo = new Date();
        warningDaysAgo.setDate(warningDaysAgo.getDate() - 83);
        const warningCandidates = await Candidate.find({
            createdAt: { $lt: warningDaysAgo, $gte: ninetyDaysAgo },
            documents: { $not: { $size: 0 } }
        });

        res.json({
            message: 'Retention check complete',
            clearedCount,
            warnings: warningCandidates.map(c => ({
                id: c._id,
                name: c.name,
                daysLeft: 90 - Math.floor((new Date() - new Date(c.createdAt)) / (1000 * 60 * 60 * 24))
            }))
        });

    } catch (error) {
        console.error('Retention Check Error:', error);
        res.status(500).json({ message: 'Error checking retention policy' });
    }
});

// --- Email: Send Offer Letter ---

// Email transporter is handled by utils/mailer.js

app.post('/api/admin/send-offer-email', authenticateToken, isAdmin, async (req, res) => {
    const { candidateId, pdfBase64, customEmail, appBaseUrl } = req.body;
    try {
        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }

        if (!pdfBase64) {
            return res.status(400).json({ message: 'Offer Letter PDF data is missing' });
        }

        const transporter = getTransporter();
        if (!transporter) {
            const service = (process.env.EMAIL_SERVICE || 'gmail').toUpperCase();
            return res.status(400).json({
                success: false,
                error: 'CREDENTIALS_MISSING',
                message: `Email Configuration Needed: Please update your ${service} credentials in .env`
            });
        }

        if (res.headersSent) return; // Exit if we already sent the error response

        const offerDetails = candidate.offerDetails || {};
        const candidateEmail = customEmail || candidate.email;
        const candidateName = offerDetails.employeeName || candidate.name;
        const companyName = offerDetails.companyName || 'Forge India Connect';
        const jobRole = offerDetails.jobRole || 'Employee';
        const joiningDate = offerDetails.joiningDate || 'TBD';

        // 🔍 DETAILED LOGGING - To trace recipient address
        console.log('=== EMAIL SEND DETAILS ===');
        console.log(`📨 Sending TO: "${candidateEmail}"`);
        console.log(`📝 customEmail from frontend: "${customEmail}"`);
        console.log(`📝 candidate.email in DB: "${candidate.email}"`);
        console.log(`📝 Service: ${process.env.EMAIL_SERVICE}`);
        console.log(`📝 From: ${process.env.EMAIL_USER}`);
        console.log('==========================');

        // SMART URL DETECTION: Use environment variable or detect from request
        let stableBaseUrl = process.env.BASE_URL || process.env.RENDER_EXTERNAL_URL;

        if (!stableBaseUrl) {
            const host = req.get('host');
            const protocol = req.get('x-forwarded-proto') || req.protocol;
            stableBaseUrl = `${protocol}://${host}`;
        }

        // Cleanup: Force replace 5173 with 5000 in the URL (helpful for local setup)
        if (stableBaseUrl.includes(':5173')) {
            stableBaseUrl = stableBaseUrl.replace(':5173', ':5000');
        } else if (stableBaseUrl.includes('localhost') && !stableBaseUrl.includes(':5000')) {
            stableBaseUrl = `${stableBaseUrl}:5000`;
        }

        const downloadUrl = `${stableBaseUrl}/api/public/offer-pdf/${candidateId}`;

        // CRITICAL: Save the PDF to the database so the link above works
        await Candidate.findByIdAndUpdate(candidateId, {
            offerPdfBase64: pdfBase64,
            offerLetterStatus: 'Sent'
        });

        const mailOptions = {
            from: `Forge India Connect HR <${process.env.EMAIL_USER}>`,
            replyTo: process.env.EMAIL_USER,
            to: candidateEmail,
            subject: `Official Offer Letter Attached - ${companyName}`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; padding: 40px; color: #1e293b;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                        <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 40px; text-align: center; color: #ffffff;">
                            <h1 style="margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.025em;">Congratulations!</h1>
                            <p style="margin-top: 12px; font-size: 18px; opacity: 0.9;">Welcome to ${companyName}</p>
                        </div>
                        
                        <div style="padding: 40px;">
                            <p style="font-size: 16px; margin-bottom: 24px;">Dear <strong>${candidateName}</strong>,</p>
                            
                            <p style="font-size: 16px; line-height: 1.7; color: #475569; margin-bottom: 24px;">
                                We are thrilled to officially offer you the position of <strong>${jobRole}</strong>. 
                                Your skills and experience stood out, and we can't wait to have you join our mission at <strong>${companyName}</strong>.
                            </p>
                            
                            <div style="background-color: #f1f5f9; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                                <h3 style="margin: 0 0 16px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">Offer Highlights</h3>
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Role:</td>
                                        <td style="padding: 8px 0; color: #1e293b; font-weight: 600; text-align: right;">${jobRole}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Joining Date:</td>
                                        <td style="padding: 8px 0; color: #1e293b; font-weight: 600; text-align: right;">${joiningDate}</td>
                                    </tr>
                                </table>
                            </div>

                            <p style="font-size: 15px; color: #475569; padding: 16px; background-color: #eff6ff; border-radius: 8px; border-left: 4px solid #2563eb;">
                                📄 <strong>Update:</strong> Your official Offer Letter is <strong>attached to this email as a PDF</strong> for your records.
                            </p>

                            <p style="font-size: 14px; color: #94a3b8; margin-top: 32px; text-align: center;">
                                Alternative access: <a href="${downloadUrl}" style="color: #2563eb; text-decoration: underline;">View in Portal</a>
                            </p>
                        </div>

                        <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0; font-size: 14px; color: #64748b;">
                                Best Regards,<br/>
                                <strong style="color: #1e293b;">HR Administration Team</strong>
                            </p>
                        </div>
                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: `Offer_Letter_${candidateName.replace(/\s+/g, '_')}.pdf`,
                    content: pdfBase64.split('base64,')[1] || pdfBase64, // Strip data URI prefix if present
                    encoding: 'base64',
                    contentType: 'application/pdf'
                }
            ]
        };

        const info = await transporter.sendMail(mailOptions);

        // Show preview URL if using test account (Ethereal)
        let previewUrl = null;
        try {
            previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) {
                console.log(`📧 EMAIL PREVIEW URL: ${previewUrl}`);
            }
        } catch (e) { /* ignore preview url errors */ }

        // Update status to 'Sent'
        await Candidate.findByIdAndUpdate(candidateId, {
            $set: { offerLetterStatus: 'Sent' }
        });

        console.log(`✅ Offer letter email sent to ${candidateEmail}`);
        res.json({
            success: true,
            message: `Offer letter sent to ${candidateEmail}`,
            previewUrl: previewUrl || null
        });

    } catch (error) {
        console.error('❌ Send Offer Email ERROR:', error);

        // Extract specific details from SMTP error
        const errorCode = error.code || 'UNKNOWN_ERROR';
        const errorMessage = error.message || 'No message provided';
        const errorResponse = error.response || 'No SMTP response';
        const errorCommand = error.command || 'N/A';

        console.error(`- Code: ${errorCode}`);
        console.error(`- Message: ${errorMessage}`);
        console.error(`- SMTP Response: ${errorResponse}`);
        console.error(`- Failed Command: ${errorCommand}`);

        // Handle common email auth errors specifically
        if (errorCode === 'EAUTH' || errorMessage.toLowerCase().includes('auth') || errorResponse.toLowerCase().includes('auth')) {
            resetTransporter(); // CRITICAL: Reset cached transporter so it reloads .env
            const service = (process.env.EMAIL_SERVICE || 'gmail').toUpperCase();
            const providerGuide = service === 'BREVO'
                ? 'Check your Brevo SMTP Key.'
                : 'Confirm your 16-digit Gmail App Password (no spaces).';

            return res.status(401).json({
                success: false,
                error: 'AUTH_FAILED',
                message: `${service} Authentication Failed: ${providerGuide}`,
                detail: errorResponse || errorMessage
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error sending offer letter email',
            error: errorCode,
            detail: errorMessage,
            smtpResponse: errorResponse
        });
    }
});


// --- Chat Routes ---

// Send Message
app.post('/api/messages', authenticateToken, async (req, res) => {
    let { sender, senderName, receiver, text } = req.body;
    try {
        // Normalize emails
        sender = sender.trim().toLowerCase();
        receiver = receiver.trim().toLowerCase();

        const newMessage = new Message({ sender, senderName, receiver, text });
        await newMessage.save();
        res.json(newMessage);
    } catch (error) {
        console.error('Send Message Error:', error);
        res.status(500).json({ message: 'Error sending message' });
    }
});

// Get Conversation (between current user and admin)
app.get('/api/messages/:userEmail', authenticateToken, async (req, res) => {
    const userEmail = req.params.userEmail.trim().toLowerCase();
    try {
        const messages = await Message.find({
            $or: [
                { sender: userEmail, receiver: 'admin' },
                { sender: 'admin', receiver: userEmail }
            ]
        }).sort({ timestamp: 1 });

        res.json(messages);
    } catch (error) {
        console.error('Fetch Messages Error:', error);
        res.status(500).json({ message: 'Error fetching messages' });
    }
});

// Admin: Get List of Active Conversations
// --- PDF Sharing: Store and Serve PDF links ---
app.post('/api/admin/save-offer-pdf', authenticateToken, isAdmin, async (req, res) => {
    const { candidateId, pdfBase64 } = req.body;
    try {
        const candidate = await Candidate.findByIdAndUpdate(candidateId, {
            offerPdfBase64: pdfBase64,
            offerLetterStatus: 'Sent'
        }, { new: true });

        if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

        res.json({ message: 'PDF saved successfully', id: candidate._id });
    } catch (error) {
        console.error('Save PDF Error:', error);
        res.status(500).json({ message: 'Error saving PDF' });
    }
});

app.get('/api/public/offer-pdf/:id', async (req, res) => {
    try {
        const candidate = await Candidate.findById(req.params.id);
        if (!candidate || !candidate.offerPdfBase64) {
            console.log(`❌ PDF Not Found for ID: ${req.params.id}`);
            return res.status(404).send('Offer letter not found. Please regenerate it.');
        }

        const pdfBuffer = Buffer.from(candidate.offerPdfBase64, 'base64');
        const filename = (candidate.name || 'Offer_Letter').replace(/\s+/g, '_');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}.pdf"`);
        return res.send(pdfBuffer);
    } catch (error) {
        console.error('Fetch PDF Error:', error);
        return res.status(500).send('Error retrieving PDF from server');
    }
});

// --- Email Setup Verification & Update ---

// Test Connection Endpoint
app.post('/api/admin/test-email-connection', authenticateToken, isAdmin, async (req, res) => {
    const { email, password, service } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and Password are required' });
        }

        const emailService = (service || 'gmail').toLowerCase();
        const config = emailService === 'brevo'
            ? { host: 'smtp-relay.brevo.com', port: 587, auth: { user: email, pass: password } }
            : { service: 'gmail', auth: { user: email, pass: password } };

        const testTransporter = nodemailer.createTransport(config);

        await testTransporter.verify();
        res.json({ success: true, message: `Connection Successful! Your ${emailService.toUpperCase()} is ready.` });
    } catch (error) {
        console.error('Test Connection Error:', error);
        res.status(400).json({
            success: false,
            message: 'Connection Failed: ' + (error.response || error.message),
            error: error.code
        });
    }
});

app.post('/api/admin/update-email-setup', authenticateToken, isAdmin, async (req, res) => {
    const { email, password, service } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and Password are required' });
        }

        const emailService = (service || 'gmail').toLowerCase();

        // Read existing .env
        let envContent = fs.readFileSync('.env', 'utf8');

        // Update lines
        const lines = envContent.split('\n');
        const updatedLines = lines.map(line => {
            if (line.startsWith('EMAIL_USER=')) return `EMAIL_USER=${email}`;
            if (line.startsWith('EMAIL_PASS=')) return `EMAIL_PASS=${password}`;
            if (line.startsWith('EMAIL_SERVICE=')) return `EMAIL_SERVICE=${emailService}`;
            return line;
        });

        // If lines were missing, add them
        if (!updatedLines.some(l => l.startsWith('EMAIL_USER='))) updatedLines.push(`EMAIL_USER=${email}`);
        if (!updatedLines.some(l => l.startsWith('EMAIL_PASS='))) updatedLines.push(`EMAIL_PASS=${password}`);
        if (!updatedLines.some(l => l.startsWith('EMAIL_SERVICE='))) updatedLines.push(`EMAIL_SERVICE=${emailService}`);

        fs.writeFileSync('.env', updatedLines.join('\n'));

        // Refresh process.env immediately
        process.env.EMAIL_USER = email;
        process.env.EMAIL_PASS = password;
        process.env.EMAIL_SERVICE = emailService;

        // FORCE MAIL UTILITY RESET
        resetTransporter();
        console.log(`✅ .env updated. Mailer utility reset. New Auth: ${email} (${emailService})`);
        res.json({ success: true, message: 'Settings saved and mailer reset!' });
    } catch (error) {
        console.error('Update Setup Error:', error);
        res.status(500).json({ message: 'Failed to update settings' });
    }
});

app.get('/api/admin/conversations', authenticateToken, isAdmin, async (req, res) => {
    try {
        const senders = await Message.distinct('sender', { sender: { $ne: 'admin' } });
        const receivers = await Message.distinct('receiver', { receiver: { $ne: 'admin' } });

        const distinctUsers = [...new Set([...senders, ...receivers])];

        const candidates = await Candidate.find({ email: { $in: distinctUsers } }).select('name email');

        res.json(candidates);
    } catch (error) {
        console.error('Fetch Conversations Error:', error);
        res.status(500).json({ message: 'Error fetching conversations' });
    }
});

// Fallback for unmatched API routes
app.all('/api/*', (req, res) => {
    console.log(`404 - API Route Not Found: ${req.method} ${req.path}`);
    res.status(404).json({
        message: `API endpoint not found: ${req.method} ${req.path}`,
        status: 'error'
    });
});

// --- Serve Frontend Production Build ---
const __dirname = path.resolve();
const publicPath = path.join(__dirname, 'public');

if (fs.existsSync(publicPath)) {
    console.log(`Serving frontend from: ${publicPath}`);
    app.use(express.static(publicPath));
}

// SPA Catch-all (must be after all API routes and static files)
app.get('*', (req, res) => {
    const indexFile = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
    } else {
        res.status(404).send('Not found');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
