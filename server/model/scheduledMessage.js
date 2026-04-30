import mongoose from "mongoose";

const scheduledMessageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    },
    text: { type: String },
    image: { type: String },
    fileName: { type: String },
    fileType: { type: String },
    scheduledTime: {
        type: Date,
        required: true
    },
    isSent: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const ScheduledMessage = mongoose.model("ScheduledMessage", scheduledMessageSchema);

export default ScheduledMessage;
