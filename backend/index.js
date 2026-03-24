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
import { getTransporter, resetTransporter } from './utils/mailer.js';
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
    try {
        fs.appendFileSync('health_test.log', `Ping at ${new Date().toISOString()}\n`);
    } catch (e) {
        console.error('Failed to write health_test.log:', e.message);
    }
    res.json({
        status: 'ok',
        version: '2.0.4-DEBUG',
        database: dbStatus,
        cwd: process.cwd(),
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

// Unified Platform Login
app.post('/api/auth/login', async (req, res) => {
    try {
        let { email, password } = req.body;

        // Trim inputs to prevent whitespace-related failures
        email = email ? email.trim() : '';
        password = password ? password.trim() : '';

        console.log(`Login attempt: '${email}'`);

        const isAdminUser = (email === 'info@forgeindiaconnect.com' && password === 'Forgeindia@09') ||
            (email === 'info@gmail.com' && password === 'Forgeindia@09') ||
            (email === 'admin@gmail.com' && password === 'admin');

        // 1. Check Admin Credentials first
        if (isAdminUser) {
            const token = jwt.sign(
                { id: 'ADMIN-001', email: email, role: 'admin' },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            return res.json({
                token,
                user: {
                    id: 'ADMIN-001',
                    name: 'Admin',
                    email: email,
                    role: 'admin'
                }
            });
        }

        // 2. Check Candidate Credentials
        const candidate = await Candidate.findOne({ email });
        if (candidate) {
            // Validate Candidate password matches their registration
            if (candidate.password !== password) {
                console.log(`Invalid candidate password attempt for: ${email}`);
                return res.status(401).json({ message: 'Invalid Email or Password' });
            }

            const token = jwt.sign(
                { id: candidate.id, email: candidate.email, role: 'candidate' },
                JWT_SECRET,
                { expiresIn: '720h' } // 30 days for candidates
            );

            return res.json({ token, user: candidate });
        }

        // 3. Neither Admin nor Candidate
        console.log(`No user found or credentials mismatched for: ${email}`);
        res.status(401).json({ message: 'Invalid Email or Password' });

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
app.put('/api/candidates/update', (req, res, next) => {
    const logMsg = `[${new Date().toISOString()}] RAW UPDATE REQUEST: ${req.method} ${req.path}\n`;
    fs.appendFileSync('debug_update.log', logMsg);
    console.log(logMsg);
    next();
}, authenticateToken, async (req, res) => {
    try {
        console.log('--- CANDIDATE UPDATE INCOMING ---');
        fs.appendFileSync('debug_update.log', '--- CANDIDATE UPDATE INCOMING ---\n');
        console.log('--- UPDATE REQUEST RECEIVED ---');
        console.log('Headers:', JSON.stringify(req.headers));
        console.log('Body:', JSON.stringify(req.body));
        
        let { email, id, ...updateData } = req.body;
        // Normalize emails and IDs for comparison
        const searchId = id || req.user.id || req.user._id;
        const targetEmail = email ? email.trim().toLowerCase() : '';
        const authEmail = req.user.email ? req.user.email.trim().toLowerCase() : '';

        // RBAC Check: Allow if Admin OR (Email matches AND ID matches/if-available)
        const isSelf = (authEmail === targetEmail) || (req.user.id && req.user.id === id);
        if (req.user.role !== 'admin' && !isSelf) {
            console.error(`DEBUG: Permission Denied. AuthEmail='${authEmail}', TargetEmail='${targetEmail}', AuthID='${req.user.id}', TargetID='${id}'`);
            return res.status(403).json({ message: 'Access Denied: You can only update your own profile' });
        }

        const debugInfo = `[${new Date().toISOString()}] UPDATE: ID='${searchId}', Email='${targetEmail}', Auth='${authEmail}'\n`;
        try { fs.appendFileSync('debug_update.log', debugInfo); } catch(e){}

        // Try findOneAndUpdate with ID or Email
        const candidate = await Candidate.findOneAndUpdate(
            { 
                $or: [
                    { _id: mongoose.isValidObjectId(searchId) ? searchId : null },
                    { id: searchId },
                    { email: { $regex: new RegExp(`^${targetEmail}$`, 'i') } }
                ]
            },
            { $set: updateData },
            { new: true }
        );

        if (!candidate) {
            const failMsg = `DEBUG: Update failed - Candidate not found for: '${email}'\n`;
            fs.appendFileSync('debug_update.log', failMsg);
            console.error(failMsg);
            return res.status(404).json({ message: 'Candidate not found in database' });
        }

        const successMsg = `✅ Update Successful for: ${email}\n`;
        fs.appendFileSync('debug_update.log', successMsg);
        console.log(successMsg);
        res.json({ user: candidate, message: 'Details updated successfully' });
    } catch (error) {
        console.error('❌ CRITICAL UPDATE ERROR:', error);
        res.status(500).json({ message: 'Internal Server Error during update', error: error.message });
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
app.post('/api/admin/reset-candidate/:id', authenticateToken, async (req, res) => {
    try {
        const targetId = req.params.id;

        // RBAC Check: Admin OR the Candidate themselves can reset this profile
        if (req.user.role !== 'admin' && req.user.id !== targetId) {
            return res.status(403).json({ message: 'Access Denied: You can only reset your own profile' });
        }

        const candidate = await Candidate.findOne({
            $or: [
                { _id: mongoose.isValidObjectId(targetId) ? targetId : null },
                { id: targetId }
            ]
        });

        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }

        // Reset all fields
        candidate.status = 'Onboarding';
        candidate.documents = [];

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
