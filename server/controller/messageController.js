//get all users expcept the logged in user
import Message from "../model/message.js"
import User from "../model/user.js"
import cloudinary from "../lib/cloudinary.js"
import { io, userSocketMap } from '../server.js'
import { getPreview } from "../lib/linkPreview.js"
import ScheduledMessage from "../model/scheduledMessage.js"
import translate from "google-translate-api-next"
import Group from "../model/group.js"

export const getUsersForSidebar = async (req, res) => {
    try {
        const userId = req.user._id
        const user = await User.findById(userId)
        
        // Find users who have exchanged messages with current user
        const messagedUserIds = await Message.distinct("senderId", { receiverId: userId })
        const sentUserIds = await Message.distinct("receiverId", { senderId: userId })
        
        const allRelevantIds = [...new Set([
            userId.toString(),
            ...(user.friends || []).map(id => id.toString()),
            ...(messagedUserIds || []).map(id => id.toString()),
            ...(sentUserIds || []).map(id => id.toString())
        ])].filter(id => !user.hiddenChats.includes(id)) // Filter out hidden chats

        const filterUsers = await User.find({ _id: { $in: allRelevantIds } }).select("-password")

        //count no of msg not seen
        const unseenMessage = {}
        const promises = filterUsers.map(async (user) => {
            const messages = await Message.find({ 
                senderId: user._id, 
                receiverId: userId, 
                seenBy: { $ne: userId } 
            })

            if (messages.length > 0) {
                unseenMessage[user._id] = messages.length
            }
        })

        // Count unread group messages
        const myGroups = await Group.find({ 
            members: userId,
            _id: { $nin: user.hiddenGroups } // Filter out hidden groups
        });
        const groupPromises = myGroups.map(async (group) => {
            const messages = await Message.find({
                groupId: group._id,
                seenBy: { $ne: userId }
            });
            if (messages.length > 0) {
                unseenMessage[group._id] = messages.length;
            }
        });

        await Promise.all([...promises, ...groupPromises])

        // Add isPinned and isMuted flags to users
        const usersWithFlags = filterUsers.map(u => {
            const userObj = u.toObject();
            userObj.isPinned = user.pinnedChats.includes(u._id);
            userObj.isMuted = user.mutedChats.includes(u._id);
            return userObj;
        });

        res.json({ success: true, users: usersWithFlags, unseenMessage })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

//get all msg for selected users
export const getMessages = async (req, res) => {
    try {
        const { id: selectedUserId } = req.params
        const myId = req.user._id
        const { limit = 30, lastMessageId } = req.query

        const query = {
            $and: [
                {
                    $or: [
                        { senderId: myId, receiverId: selectedUserId },
                        { senderId: selectedUserId, receiverId: myId },
                    ]
                },
                {
                    $or: [
                        { visibleTo: { $exists: false } },
                        { visibleTo: { $size: 0 } },
                        { visibleTo: myId }
                    ]
                }
            ]
        }

        if (lastMessageId) {
            query._id = { $lt: lastMessageId }
        }

        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate("replyTo")
            .populate("senderId", "fullName profilePic")
            .populate("seenBy", "fullName profilePic")
            .populate("deliveredTo", "fullName profilePic")

        const hasMore = messages.length === parseInt(limit)
        const sortedMessages = messages.reverse()

        // Mark as seen (Check privacy settings)
        const recipient = await User.findById(selectedUserId);
        const mySettings = req.user.settings || { showReadReceipts: true };
        const recipientSettings = recipient?.settings || { showReadReceipts: true };

        if (mySettings.showReadReceipts && recipientSettings.showReadReceipts) {
            await Message.updateMany(
                { senderId: selectedUserId, receiverId: myId, seenBy: { $ne: myId } },
                { $addToSet: { seenBy: myId } }
            )

            // Emit to sender that messages were seen
            const senderSocketId = userSocketMap[selectedUserId]
            if (senderSocketId) {
                io.to(senderSocketId).emit("messagesSeen", { userId: myId })
            }
        }

        res.json({ success: true, messages: sortedMessages, hasMore })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

//api to mark message as seen using message id
export const markMessageAsSeen = async (req, res) => {
    try {
        const { id } = req.params
        const userId = req.user._id
        
        const message = await Message.findById(id).populate("senderId", "settings");
        if (!message) return res.json({ success: false, message: "Message not found" });

        const mySettings = req.user.settings || { showReadReceipts: true };
        const senderSettings = message.senderId?.settings || { showReadReceipts: true };

        if (mySettings.showReadReceipts && senderSettings.showReadReceipts) {
            await Message.findByIdAndUpdate(id, { $addToSet: { seenBy: userId } })
            
            // Emit to sender
            const senderSocketId = userSocketMap[message.senderId._id]
            if (senderSocketId) {
                io.to(senderSocketId).emit("messageSeen", { messageId: id, seenBy: userId })
            }
        }

        res.json({ success: true })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

//api to mark message as delivered
export const markMessageAsDelivered = async (req, res) => {
    try {
        const { id } = req.params
        const userId = req.user._id
        const message = await Message.findByIdAndUpdate(id, { $addToSet: { deliveredTo: userId } }, { new: true })
        
        // Emit to sender
        const senderSocketId = userSocketMap[message.senderId]
        if (senderSocketId) {
            io.to(senderSocketId).emit("messageUpdated", message)
        }

        res.json({ success: true })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

//send msg to selected user
export const sendMessage = async (req, res) => {
    try {
        const { text, image, fileName, fileType, replyTo, isSpoiler } = req.body
        const receiverId = req.params.id
        const senderId = req.user._id

        let linkMeta = null
        if (text) {
            linkMeta = await getPreview(text)
        }

        let fileUrl = ""
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image, {
                resource_type: "auto"
            })
            fileUrl = uploadResponse.secure_url
        }

        const isAiPrompt = text && text.toLowerCase().startsWith('@ai ');

        const newMessage = await (await Message.create({
            senderId,
            receiverId,
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
        })).populate(["replyTo", "senderId"])

        // Check if receiver is online for delivery status
        const receiverSocketId = userSocketMap[receiverId]

        // Unhide chat for receiver if it was hidden
        await User.findByIdAndUpdate(receiverId, { $pull: { hiddenChats: senderId } })

        // Prevent duplicate socket emit if sending to self (Message Yourself)
        if (receiverSocketId && !isAiPrompt && senderId.toString() !== receiverId.toString()) {
            newMessage.deliveredTo.push(receiverId)
            await newMessage.save()
            io.to(receiverSocketId).emit("newMessage", newMessage)
        }

        res.json({ success: true, newMessage })

        // AI Assistant feature
        if (text && text.toLowerCase().startsWith('@ai ')) {
            const prompt = text.substring(4).trim()
            if (prompt) {
                // Run asynchronously without blocking response
                (async () => {
                    try {
                        const aiResp = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`)
                        if (aiResp.ok) {
                            const aiText = await aiResp.text()
                            const aiMessage = await (await Message.create({
                                senderId: receiverId, // Make it look like a reply
                                receiverId: senderId,
                                text: `🤖 **AI Assistant:**\n\n${aiText}`,
                                deliveredTo: [senderId, receiverId],
                                visibleTo: [senderId]
                            })).populate("replyTo")
                            
                            const senderSocket = userSocketMap[senderId]
                            if (senderSocket) io.to(senderSocket).emit("newMessage", aiMessage)
                            // Do not emit to receiverSocketId
                        }
                    } catch (e) {
                        console.error("AI Assistant error:", e)
                    }
                })()
            }
        }
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

//edit message
export const editMessage = async (req, res) => {
    try {
        const { id } = req.params
        const { text } = req.body
        const userId = req.user._id

        const message = await Message.findById(id)
        if (!message) return res.json({ success: false, message: "Message not found" })
        if (message.senderId.toString() !== userId.toString()) return res.json({ success: false, message: "Unauthorized" })

        const messageTime = new Date(message.createdAt).getTime()
        const currentTime = Date.now()
        const diff = currentTime - messageTime
        if (diff > 10 * 60 * 1000) {
            return res.json({ success: false, message: "Edit time expired (10 min limit)" })
        }

        message.text = text
        message.isEdited = true
        await message.save()

        const recipientId = message.receiverId || message.groupId
        if (message.groupId) {
            io.to(message.groupId.toString()).emit("messageUpdated", message)
        } else {
            const receiverSocketId = userSocketMap[message.receiverId]
            if (receiverSocketId) io.to(receiverSocketId).emit("messageEdited", message)
        }

        res.json({ success: true, message })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

//delete message
export const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params
        const userId = req.user._id

        const message = await Message.findById(id)
        if (!message) return res.json({ success: false, message: "Message not found" })
        if (message.senderId.toString() !== userId.toString()) return res.json({ success: false, message: "Unauthorized" })

        // Cleanup Cloudinary
        if (message.image) {
            try {
                const publicId = message.image.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(publicId);
            } catch (err) {
                console.log("Cloudinary cleanup failed:", err.message);
            }
        }

        await Message.findByIdAndDelete(id)

        if (message.groupId) {
            io.to(message.groupId.toString()).emit("messageDeleted", id)
        } else {
            const receiverSocketId = userSocketMap[message.receiverId]
            if (receiverSocketId) io.to(receiverSocketId).emit("messageDeleted", id)
        }

        res.json({ success: true, message: "Message deleted" })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// React to message
export const reactToMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { emoji } = req.body;
        const userId = req.user._id;

        const message = await Message.findById(id);
        if (!message) return res.json({ success: false, message: "Message not found" });

        const reactionIndex = message.reactions.findIndex(r => r.userId.toString() === userId.toString());

        if (reactionIndex > -1) {
            if (message.reactions[reactionIndex].emoji === emoji) {
                message.reactions.splice(reactionIndex, 1);
            } else {
                message.reactions[reactionIndex].emoji = emoji;
            }
        } else {
            message.reactions.push({ userId, emoji });
        }

        await message.save();

        if (message.groupId) {
            io.to(message.groupId.toString()).emit("messageUpdated", message);
        } else {
            const receiverSocketId = userSocketMap[message.receiverId];
            if (receiverSocketId) io.to(receiverSocketId).emit("messageUpdated", message);
            const senderSocketId = userSocketMap[message.senderId];
            if (senderSocketId) io.to(senderSocketId).emit("messageUpdated", message);
        }

        res.json({ success: true, message });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Star/Unstar message
export const starMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const message = await Message.findById(id);
        if (!message) return res.json({ success: false, message: "Message not found" });

        const starredIndex = message.starredBy.indexOf(userId);
        if (starredIndex > -1) {
            message.starredBy.splice(starredIndex, 1);
        } else {
            message.starredBy.push(userId);
        }

        await message.save();
        res.json({ success: true, message });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Toggle Pin message
export const togglePinMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const message = await Message.findById(id);
        if (!message) return res.json({ success: false, message: "Message not found" });

        message.isPinned = !message.isPinned;
        await message.save();

        if (message.groupId) {
            io.to(message.groupId.toString()).emit("messageUpdated", message);
        } else {
            const receiverSocketId = userSocketMap[message.receiverId];
            if (receiverSocketId) io.to(receiverSocketId).emit("messageUpdated", message);
            const senderSocketId = userSocketMap[message.senderId];
            if (senderSocketId) io.to(senderSocketId).emit("messageUpdated", message);
        }

        res.json({ success: true, message });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Schedule Message
export const scheduleMessage = async (req, res) => {
    try {
        const { text, image, fileName, fileType, scheduledTime, receiverId, groupId } = req.body;
        const senderId = req.user._id;

        if (!scheduledTime) return res.json({ success: false, message: "Scheduled time is required" });

        const newScheduledMessage = await ScheduledMessage.create({
            senderId,
            receiverId,
            groupId,
            text,
            image,
            fileName,
            fileType,
            scheduledTime: new Date(scheduledTime)
        });

        res.json({ success: true, message: "Message scheduled successfully", scheduledMessage: newScheduledMessage });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Translate Message
export const translateMessage = async (req, res) => {
    try {
        const { text, targetLang = 'mr' } = req.body;
        if (!text) return res.json({ success: false, message: "Text is required" });

        const result = await translate(text, { to: targetLang });
        res.json({ success: true, translatedText: result.text });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const deleteChat = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const { isGroup } = req.body;

        if (isGroup) {
            await User.findByIdAndUpdate(userId, { $addToSet: { hiddenGroups: id } });
        } else {
            await User.findByIdAndUpdate(userId, { $addToSet: { hiddenChats: id } });
        }

        res.json({ success: true, message: "Chat deleted successfully" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const clearChat = async (req, res) => {
    try {
        const { id: targetId } = req.params;
        const myId = req.user._id;
        const { isGroup } = req.body;

        if (isGroup) {
            await User.findByIdAndUpdate(myId, { $addToSet: { hiddenGroups: targetId } });
        } else {
            await User.findByIdAndUpdate(myId, { $addToSet: { hiddenChats: targetId } });
        }

        res.json({ success: true, message: "Chat cleared successfully" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const togglePinChat = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const { isGroup } = req.body;

        const field = isGroup ? 'pinnedGroups' : 'pinnedChats';
        const user = await User.findById(userId);
        
        const isPinned = user[field].includes(id);
        if (isPinned) {
            await User.findByIdAndUpdate(userId, { $pull: { [field]: id } });
        } else {
            await User.findByIdAndUpdate(userId, { $addToSet: { [field]: id } });
        }

        res.json({ success: true, message: isPinned ? "Unpinned" : "Pinned", isPinned: !isPinned });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const toggleMuteChat = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const { isGroup } = req.body;

        const field = isGroup ? 'mutedGroups' : 'mutedChats';
        const user = await User.findById(userId);
        
        const isMuted = user[field].includes(id);
        if (isMuted) {
            await User.findByIdAndUpdate(userId, { $pull: { [field]: id } });
        } else {
            await User.findByIdAndUpdate(userId, { $addToSet: { [field]: id } });
        }

        res.json({ success: true, message: isMuted ? "Unmuted" : "Muted", isMuted: !isMuted });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
