import express from "express";
import "dotenv/config";
import http from "http";
import cors from "cors";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoute.js";
import groupRouter from "./routes/groupRoute.js";
import { Server } from 'socket.io'
import User from "./model/user.js";
import initCronJobs from "./lib/cron.js";

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
    "http://localhost:5173", 
    "http://localhost:5174",
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

export const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

export const userSocketMap = {};

io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) userSocketMap[userId] = socket.id;
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("joinGroup", (groupId) => socket.join(groupId));
    socket.on("leaveGroup", (groupId) => socket.leave(groupId));

    socket.on("typing", ({ receiverId, groupId }) => {
        if (groupId) socket.to(groupId).emit("displayTyping", { userId, groupId });
        else {
            const receiverSocketId = userSocketMap[receiverId];
            if (receiverSocketId) socket.to(receiverSocketId).emit("displayTyping", { userId });
        }
    });

    socket.on("stopTyping", ({ receiverId, groupId }) => {
        if (groupId) socket.to(groupId).emit("hideTyping", { userId, groupId });
        else {
            const receiverSocketId = userSocketMap[receiverId];
            if (receiverSocketId) socket.to(receiverSocketId).emit("hideTyping", { userId });
        }
    });

    socket.on("disconnect", async () => {
        if (userId) {
            await User.findByIdAndUpdate(userId, { lastSeen: Date.now() });
            delete userSocketMap[userId];
        }
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

app.use(express.json({ limit: "4mb" }));
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);
app.use("/api/groups", groupRouter);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    initCronJobs();
    server.listen(PORT, () => {
        console.log("Server is running on PORT:" + PORT);
    });
}).catch((err) => {
    console.error("Failed to connect DB:", err.message);
});