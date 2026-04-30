import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 6 },
    profilePic: { type: String, default: "" },
    bio: { type: String, default: "Hey there! I am using Chat App" },
    status: { type: String, default: "Available" },
    settings: {
        showReadReceipts: { type: Boolean, default: true },
        translationEnabled: { type: Boolean, default: false },
    },
    wallpaper: { type: String, default: "" },
    lastSeen: { type: Date, default: Date.now },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    hiddenChats: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    hiddenGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
    pinnedChats: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    pinnedGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
    mutedChats: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    mutedGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }]


}, {
    timestamps: true
})

const User = mongoose.model("User", userSchema)

export default User