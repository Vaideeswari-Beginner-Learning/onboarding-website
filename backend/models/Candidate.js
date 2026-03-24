import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    password: { type: String, required: true }, // Verify if this is hashed in real app
    role: { type: String, default: 'candidate' },
    status: { type: String, default: 'Onboarding' },
    date: { type: String, default: () => new Date().toISOString().split('T')[0] },
    personalDetails: {
        firstName: String,
        lastName: String,
        fatherName: String,
        dob: String,
        gender: String,
        phone: String,
        email: String,
        address: String,
        city: String,
        state: String,
        zip: String,
        emergencyName: String,
        emergencyPhone: String,
        jobRole: String, // Added for Offer Letter workflow
        employeeId: String, // Added
        joiningDate: String  // Added
    },

    bankDetails: {
        accountName: String,
        accountNumber: String,
        ifscCode: String,
        bankName: String,
        panNumber: String
    },
    documents: [{
        name: String,
        url: String, // In a real app, this would be a URL to S3 or similar
        type: { type: String }, // 'type' is a reserved keyword in Mongoose
        size: String,
        status: { type: String, default: 'Pending' },
        uploadedAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

const Candidate = mongoose.model('Candidate', candidateSchema);

export default Candidate;
