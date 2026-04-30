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

// create express app and HTTP server
const app = express();
const server = http.createServer(app);

// Configure CORS for production and development
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


//store online users
export const userSocketMap = {};//{userId:socketId}


//socket.io
io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log("User connected", userId);
    if (userId) userSocketMap[userId] = socket.id


    //emit online usrs to all connected client
    io.emit("getOnlineUsers", Object.keys(userSocketMap))

    socket.on("joinGroup", (groupId) => {
        socket.join(groupId);
        console.log(`User ${userId} joined group room: ${groupId}`);
    });

    socket.on("leaveGroup", (groupId) => {
        socket.leave(groupId);
        console.log(`User ${userId} left group room: ${groupId}`);
    });

    socket.on("typing", ({ receiverId, groupId }) => {
        if (groupId) {
            // Group Typing
            socket.to(groupId).emit("displayTyping", { userId, groupId });
        } else {
            // Direct Typing
            const receiverSocketId = userSocketMap[receiverId];
            if (receiverSocketId) {
                socket.to(receiverSocketId).emit("displayTyping", { userId });
            }
        }
    });

    socket.on("stopTyping", ({ receiverId, groupId }) => {
        if (groupId) {
            // Group Stop Typing
            socket.to(groupId).emit("hideTyping", { userId, groupId });
        } else {
            // Direct Stop Typing
            const receiverSocketId = userSocketMap[receiverId];
            if (receiverSocketId) {
                socket.to(receiverSocketId).emit("hideTyping", { userId });
            }
        }
    });

    socket.on("disconnect", async () => {
        console.log("User Disconnected", userId);
        if (userId) {
            await User.findByIdAndUpdate(userId, { lastSeen: Date.now() });
            delete userSocketMap[userId]
        }
        io.emit("getOnlineUsers", Object.keys(userSocketMap))

    })

})

// middleware
app.use(express.json({ limit: "4mb" }));


// test route
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);
app.use("/api/groups", groupRouter);

if(process.env.NODE_ENV!=="production"){
// connect DB & start server
const PORT = process.env.PORT || 5000;

connectDB()
    .then(() => {
        initCronJobs();
        server.listen(PORT, () => {
            console.log("Server is running on PORT:" + PORT);
        });
    })
    .catch((err) => {
        console.error("Failed to connect DB:", err.message);
    });
}

//export server for vercel
export default server;