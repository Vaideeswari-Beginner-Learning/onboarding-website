import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sender: { type: String, required: true }, // 'admin' or 'candidate' (or specific email)
    senderName: { type: String },
    receiver: { type: String, required: true }, // 'admin' or candidate email
    text: { type: String, required: true },
    read: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
}, {
    timestamps: true
});

const Message = mongoose.model('Message', messageSchema);

export default Message;
