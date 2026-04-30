import cron from "node-cron";
import ScheduledMessage from "../model/scheduledMessage.js";
import Message from "../model/message.js";
import { io, userSocketMap } from "../server.js";
import { getPreview } from "./linkPreview.js";

const initCronJobs = () => {
    // Run every minute
    cron.schedule("* * * * *", async () => {
        try {
            const now = new Date();
            const dueMessages = await ScheduledMessage.find({
                scheduledTime: { $lte: now },
                isSent: false
            });

            for (const msg of dueMessages) {
                let linkMeta = null;
                if (msg.text) {
                    linkMeta = await getPreview(msg.text);
                }

                const newMessage = await Message.create({
                    senderId: msg.senderId,
                    receiverId: msg.receiverId,
                    groupId: msg.groupId,
                    text: msg.text,
                    image: msg.image,
                    fileName: msg.fileName,
                    fileType: msg.fileType,
                    linkMeta,
                    deliveredTo: [msg.senderId]
                });

                const populatedMessage = await Message.findById(newMessage._id).populate("replyTo").populate("senderId", "fullName profilePic");

                if (msg.groupId) {
                    io.to(msg.groupId.toString()).emit("newGroupMessage", populatedMessage);
                } else {
                    const receiverSocketId = userSocketMap[msg.receiverId];
                    if (receiverSocketId) {
                        io.to(receiverSocketId).emit("newMessage", populatedMessage);
                    }
                    const senderSocketId = userSocketMap[msg.senderId];
                    if (senderSocketId) {
                        io.to(senderSocketId).emit("newMessage", populatedMessage);
                    }
                }

                msg.isSent = true;
                await msg.save();
                // Optionally delete the scheduled message after sending
                await ScheduledMessage.findByIdAndDelete(msg._id);
            }
        } catch (error) {
            console.error("Cron job error:", error);
        }
    });
};

export default initCronJobs;
