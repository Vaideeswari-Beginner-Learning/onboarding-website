import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Candidate from './models/Candidate.js';

async function createIndex() {
    try {
         // Connect to DB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Force index creation
        console.log('Creating email index...');
        await Candidate.collection.createIndex({ email: 1 }, { unique: true });
        console.log('Index created successfully!');
        
        // Show current indexes
        const indexes = await Candidate.collection.indexes();
        console.log('Current Indexes:', indexes);

        await mongoose.disconnect();
    } catch(err) {
        console.error('Error:', err);
    }
}
createIndex();
