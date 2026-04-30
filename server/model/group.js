import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    groupProfile: { type: String, default: "" },
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }
}, {
    timestamps: true
})

const Group = mongoose.model("Group", groupSchema)

export default Group
