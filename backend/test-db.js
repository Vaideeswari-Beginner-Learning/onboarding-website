import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI;
console.log('Attempting to connect to MongoDB...');
console.log('URI:', uri ? uri.replace(/:([^@]+)@/, ':****@') : 'UNDEFINED');

mongoose.connect(uri)
  .then(() => {
    console.log('✅ SUCCESS: MongoDB Connected');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ FAILURE: MongoDB Connection Error:');
    console.error(err);
    process.exit(1);
  });

setTimeout(() => {
  console.log('⚠️ TIMEOUT: Connection check exceeded 15 seconds');
  process.exit(1);
}, 15000);
