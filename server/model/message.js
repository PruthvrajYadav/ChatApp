import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', reuqired: true
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
    seenBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    reactions: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        emoji: { type: String }
    }],
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    starredBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isEdited: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    deliveredTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isSystemMessage: { type: Boolean, default: false },
    isSpoiler: { type: Boolean, default: false },
    visibleTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    linkMeta: {
        title: String,
        description: String,
        image: String,
        url: String
    }
}, {
    timestamps: true
})

const Message = mongoose.model("Message", messageSchema)

export default Message