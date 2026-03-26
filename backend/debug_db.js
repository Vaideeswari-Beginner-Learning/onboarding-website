import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;

async function checkCandidates() {
    try {
        await mongoose.connect(MONGODB_URI);
        const db = mongoose.connection.db;
        const candidates = await db.collection('candidates').find({}).toArray();
        
        console.log(`TOTAL CANDIDATES: ${candidates.length}`);
        
        candidates.forEach(c => {
            console.log(`ID_TYPE: ${typeof c._id}, _id: ${c._id}, id: ${c.id}, email: ${c.email}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkCandidates();
