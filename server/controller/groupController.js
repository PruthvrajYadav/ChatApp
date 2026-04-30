import Group from "../model/group.js";
import User from "../model/user.js";
import Message from "../model/message.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from '../server.js'
import { getPreview } from "../lib/linkPreview.js"

const createSystemMessage = async (groupId, text) => {
    const message = await Message.create({
        groupId,
        text,
        isSystemMessage: true
    });
    io.to(groupId.toString()).emit("newGroupMessage", { groupId, message });
    return message;
};

// Create a new group
export const createGroup = async (req, res) => {
    try {
        const { name, members, groupProfile } = req.body;
        const adminId = req.user._id;

        const allMembers = [...new Set([...members, adminId.toString()])];

        let profileUrl = "";
        if (groupProfile) {
            const uploadResponse = await cloudinary.uploader.upload(groupProfile);
            profileUrl = uploadResponse.secure_url;
        }

        const newGroup = await Group.create({
            name,
            members: allMembers,
            admins: [adminId],
            groupProfile: profileUrl
        });

        const populatedGroup = await Group.findById(newGroup._id)
            .populate("members", "-password")
            .populate("admins", "-password");

        res.json({ success: true, group: populatedGroup });
        
        // Log creation
        await createSystemMessage(newGroup._id, `Group created by ${req.user.fullName}`);
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get all groups user is a part of
export const getMyGroups = async (req, res) => {
    try {
        const userId = req.user._id;
        const groups = await Group.find({ members: userId })
            .populate("members", "-password")
            .populate("admins", "-password");
        res.json({ success: true, groups });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Send message to group
export const sendGroupMessage = async (req, res) => {
    try {
        const { text, image, fileName, fileType, replyTo, isSpoiler } = req.body;
        const { groupId } = req.params;
        const senderId = req.user._id;

        let linkMeta = null;
        if (text) {
            linkMeta = await getPreview(text);
        }

        const group = await Group.findById(groupId);
        if (!group) return res.json({ success: false, message: "Group not found" });

        let fileUrl = "";
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image, { resource_type: "auto" });
            fileUrl = uploadResponse.secure_url;
        }

        const isAiPrompt = text && text.toLowerCase().startsWith('@ai ');

        const newMessage = await (await Message.create({
            senderId,
            groupId,
            text,
            image: fileUrl,
            fileName,
            fileType,
            replyTo,
            isSpoiler,
            linkMeta,
            seenBy: [senderId],
            deliveredTo: [senderId],
            visibleTo: isAiPrompt ? [senderId] : []
        })).populate(["replyTo", { path: "senderId", select: "fullName profilePic" }]);

        group.lastMessage = newMessage._id;
        await group.save();

        // Unhide group for all members who had it hidden
        await User.updateMany(
            { _id: { $in: group.members } },
            { $pull: { hiddenGroups: groupId } }
        );

        // Optimized: Emit to group room
        if (!isAiPrompt) {
            io.to(groupId).emit("newGroupMessage", { groupId, message: newMessage });
        }

        res.json({ success: true, newMessage });

        // AI Assistant feature for Groups
        if (text && text.toLowerCase().startsWith('@ai ')) {
            const prompt = text.substring(4).trim();
            if (prompt) {
                // Run asynchronously without blocking response
                (async () => {
                    try {
                        const aiResp = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`);
                        if (aiResp.ok) {
                            const aiText = await aiResp.text();
                            const aiMessage = await (await Message.create({
                                senderId: senderId,
                                groupId: groupId,
                                text: `🤖 **AI Assistant:**\n\n${aiText}`,
                                deliveredTo: [senderId],
                                visibleTo: [senderId]
                            })).populate(["replyTo", { path: "senderId", select: "fullName profilePic" }]);
                            
                            group.lastMessage = aiMessage._id;
                            await group.save();
                            
                            // Emit only to sender
                            const senderSocket = userSocketMap[senderId];
                            if (senderSocket) io.to(senderSocket).emit("newGroupMessage", { groupId, message: aiMessage });
                        }
                    } catch (e) {
                        console.error("AI Group Assistant error:", e);
                    }
                })();
            }
        }
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get group messages
export const getGroupMessages = async (req, res) => {
    try {
        const { groupId } = req.params;
        const myId = req.user._id;
        const { limit = 30, lastMessageId } = req.query;

        const query = { 
            groupId, 
            $or: [
                { visibleTo: { $exists: false } },
                { visibleTo: { $size: 0 } },
                { visibleTo: myId }
            ]
        };
        if (lastMessageId) query._id = { $lt: lastMessageId };

        const fetchedMessages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate("senderId", "fullName profilePic")
            .populate("replyTo")
            .populate("seenBy", "fullName profilePic")
            .populate("deliveredTo", "fullName profilePic");

        const hasMore = fetchedMessages.length === parseInt(limit);
        const sortedMessages = fetchedMessages.reverse();

        await Message.updateMany(
            { groupId, seenBy: { $ne: myId } },
            { $addToSet: { seenBy: myId } }
        )

        // Emit to group that user has seen messages
        io.to(groupId.toString()).emit("groupMessagesSeen", { groupId, userId: myId });

        res.json({ success: true, messages: sortedMessages, hasMore });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Update group info (Admins only)
export const updateGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { name, groupProfile } = req.body;
        const userId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group) return res.json({ success: false, message: "Group not found" });
        
        if (!group.admins.some(adminId => adminId.toString() === userId.toString())) {
            return res.json({ success: false, message: "Only admins can update group info" });
        }

        if (name) group.name = name;
        if (groupProfile) {
            const uploadResponse = await cloudinary.uploader.upload(groupProfile);
            group.groupProfile = uploadResponse.secure_url;
        }

        await group.save();
        const updatedGroup = await Group.findById(groupId)
            .populate("members", "-password")
            .populate("admins", "-password");

        res.json({ success: true, group: updatedGroup });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Add members to group (Admins only)
export const addMembers = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { members } = req.body;
        const userId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group) return res.json({ success: false, message: "Group not found" });

        if (!group.admins.some(adminId => adminId.toString() === userId.toString())) {
            return res.json({ success: false, message: "Only admins can add members" });
        }

        const currentMembers = group.members.map(m => m.toString());
        const newMembers = members.filter(id => !currentMembers.includes(id));
        
        group.members.push(...newMembers);
        await group.save();

        // Log actions
        const addedUsers = await User.find({ _id: { $in: newMembers } });
        const names = addedUsers.map(u => u.fullName).join(", ");
        await createSystemMessage(groupId, `${req.user.fullName} added ${names}`);

        const updatedGroup = await Group.findById(groupId)
            .populate("members", "-password")
            .populate("admins", "-password");

        io.to(groupId).emit("groupUpdated", updatedGroup);
        res.json({ success: true, group: updatedGroup });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Remove member (Admins only)
export const removeMember = async (req, res) => {
    try {
        const { groupId, memberId } = req.params;
        const userId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group) return res.json({ success: false, message: "Group not found" });

        if (!group.admins.some(adminId => adminId.toString() === userId.toString())) {
            return res.json({ success: false, message: "Only admins can remove members" });
        }

        // Cannot remove self if only one admin left
        if (memberId === userId.toString() && group.admins.length === 1) {
            return res.json({ success: false, message: "Cannot leave group as the only admin. Promote someone else first." });
        }

        group.members = group.members.filter(m => m.toString() !== memberId);
        group.admins = group.admins.filter(a => a.toString() !== memberId);

        await group.save();

        // Log action
        const removedUser = await User.findById(memberId);
        if (memberId === userId.toString()) {
            await createSystemMessage(groupId, `${removedUser.fullName} left the group`);
        } else {
            await createSystemMessage(groupId, `${req.user.fullName} removed ${removedUser.fullName}`);
        }

        const updatedGroup = await Group.findById(groupId)
            .populate("members", "-password")
            .populate("admins", "-password");

        io.to(groupId).emit("groupUpdated", updatedGroup);
        res.json({ success: true, group: updatedGroup });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Promote to Admin (Admins only)
export const promoteToAdmin = async (req, res) => {
    try {
        const { groupId, memberId } = req.params;
        const userId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group) return res.json({ success: false, message: "Group not found" });

        if (!group.admins.some(adminId => adminId.toString() === userId.toString())) {
            return res.json({ success: false, message: "Only admins can promote others" });
        }

        if (!group.admins.some(adminId => adminId.toString() === memberId)) {
            group.admins.push(memberId);
            await group.save();
            
            // Log action
            const promotedUser = await User.findById(memberId);
            await createSystemMessage(groupId, `${req.user.fullName} promoted ${promotedUser.fullName} to Admin`);
        }

        const updatedGroup = await Group.findById(groupId)
            .populate("members", "-password")
            .populate("admins", "-password");

        io.to(groupId).emit("groupUpdated", updatedGroup);
        res.json({ success: true, group: updatedGroup });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
