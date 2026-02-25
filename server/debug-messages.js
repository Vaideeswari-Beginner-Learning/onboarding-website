import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const messageSchema = new mongoose.Schema({
    sender: { type: String, required: true },
    senderName: { type: String },
    receiver: { type: String, required: true },
    text: { type: String, required: true },
    read: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
const Candidate = mongoose.model('Candidate', new mongoose.Schema({}, { strict: false }));

const runDebug = async () => {
    try {
        // 1. Check DB directly
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const count = await Message.countDocuments({
            $or: [
                { sender: 'myname@gmail.com', receiver: 'admin' },
                { sender: 'admin', receiver: 'myname@gmail.com' }
            ]
        });
        console.log(`DB Direct Check: Found ${count} messages for myname@gmail.com`);

        // 2. Test API Endpoint
        console.log('\nTesting API Endpoint: http://localhost:5000/api/messages/myname@gmail.com');
        try {
            const response = await fetch('http://localhost:5000/api/messages/myname@gmail.com');
            if (response.ok) {
                const data = await response.json();
                console.log(`API Response: Found ${data.length} messages`);
                if (data.length > 0) {
                    console.log('First message sample:', JSON.stringify(data[0], null, 2));
                }
            } else {
                console.log('API Response Error:', response.status, response.statusText);
            }
        } catch (err) {
            console.log('API Fetch Error (Server might be down?):', err.message);
        }

    } catch (error) {
        console.error('Script Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

runDebug();
