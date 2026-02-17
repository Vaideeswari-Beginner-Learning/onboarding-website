import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Candidate from './models/Candidate.js';
import Message from './models/Message.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Simplified CORS for debugging
app.use(cors({
    origin: true, // Reflects the request origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'] // Explicitly allow common headers
}));
app.use(express.json({ limit: '10mb' }));

// Health Check Endpoint to verify deployment
app.get('/api/health-check', (req, res) => {
    res.json({
        status: 'ok',
        version: '1.2.0-cors-fix',
        timestamp: new Date().toISOString(),
        cors_mode: 'origin:true'
    });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Middleware to log requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Routes

// Admin Login
app.post('/api/auth/login', (req, res) => {
    try {
        const { email, password } = req.body;
        const passLen = password ? password.length : 'N/A';
        console.log(`Login attempt: '${email}' with password length: ${passLen}`);
        console.log(`Expected: 'info@forgeindiaconnect.com'`);

        // Hardcoded admin for demo
        if (email === 'info@forgeindiaconnect.com' && password === 'Forgeindia@09') {
            res.json({
                user: {
                    id: 'ADMIN-001',
                    name: 'Super Admin',
                    email: 'info@forgeindiaconnect.com',
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
                name: email.split('@')[0], // Default name from email
                email: email,
                role: 'candidate',
                status: 'Onboarding',
                date: new Date().toISOString().split('T')[0],
                documents: []
            });
            await candidate.save();
        }

        res.json({ user: candidate });
    } catch (error) {
        console.error('Candidate Login Error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Candidate Register
app.post('/api/auth/register', async (req, res) => {
    const { name, email, phone, password } = req.body;

    try {
        // Check if user exists
        const existingCandidate = await Candidate.findOne({ email });
        if (existingCandidate) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newCandidate = new Candidate({
            id: 'CAND-' + Math.random().toString(36).substr(2, 9),
            name,
            email,
            phone,
            password, // In real app, hash this
            role: 'candidate',
            status: 'Onboarding',
            date: new Date().toISOString().split('T')[0],
            documents: []
        });

        await newCandidate.save();
        res.json({ user: newCandidate });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

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

            res.json({ user: candidate });
        } catch (error) {
            console.error('OTP Verification Error:', error);
            res.status(500).json({ message: 'Server error during verification' });
        }
    } else {
        res.status(400).json({ message: 'Invalid OTP' });
    }
});

// Candidate Update Details
app.put('/api/candidates/update', async (req, res) => {
    const { email, ...updateData } = req.body;

    try {
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
app.post('/api/candidates/request-offer', async (req, res) => {
    const { email } = req.body;
    try {
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
app.post('/api/admin/generate-offer', async (req, res) => {
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
app.get('/api/candidates', async (req, res) => {
    try {
        const candidates = await Candidate.find();
        res.json(candidates);
    } catch (error) {
        console.error('Fetch Candidates Error:', error);
        res.status(500).json({ message: 'Server error fetching candidates' });
    }
});

// Get Single Candidate by ID
app.get('/api/candidates/:id', async (req, res) => {
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
        res.json(candidate);
    } catch (error) {
        console.error('Fetch Candidate Error:', error);
        res.status(500).json({ message: 'Server error fetching candidate' });
    }
});

// Delete Candidate
app.delete('/api/candidates/:id', async (req, res) => {
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

// Retention Policy Check (90 Days)
app.get('/api/admin/check-retention', async (req, res) => {
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
app.post('/api/messages', async (req, res) => {
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
app.get('/api/messages/:userEmail', async (req, res) => {
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
app.get('/api/admin/conversations', async (req, res) => {
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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
