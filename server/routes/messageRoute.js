import express from 'express'
import { protectRoute } from '../middleware/auth.js'
import { 
    deleteMessage, 
    editMessage, 
    getMessages, 
    getUsersForSidebar, 
    markMessageAsSeen, 
    markMessageAsDelivered,
    sendMessage, 
    reactToMessage, 
    starMessage,
    togglePinMessage,
    scheduleMessage,
    translateMessage,
    deleteChat,
    clearChat,
    togglePinChat,
    toggleMuteChat
} from '../controller/messageController.js'

const messageRouter = express.Router()

messageRouter.get("/users", protectRoute, getUsersForSidebar)
messageRouter.get("/:id", protectRoute, getMessages)
messageRouter.post("/delete-chat/:id", protectRoute, deleteChat)
messageRouter.post("/clear-chat/:id", protectRoute, clearChat)
messageRouter.post("/pin-chat/:id", protectRoute, togglePinChat)
messageRouter.post("/mute-chat/:id", protectRoute, toggleMuteChat)
messageRouter.put("/mark/:id", protectRoute, markMessageAsSeen)
messageRouter.put("/delivered/:id", protectRoute, markMessageAsDelivered)
messageRouter.post("/send/:id", protectRoute, sendMessage)
messageRouter.post("/schedule", protectRoute, scheduleMessage)
messageRouter.post("/translate", protectRoute, translateMessage)
messageRouter.put("/edit/:id", protectRoute, editMessage)
messageRouter.delete("/delete/:id", protectRoute, deleteMessage)
messageRouter.put("/react/:id", protectRoute, reactToMessage)
messageRouter.put("/star/:id", protectRoute, starMessage)
messageRouter.put("/pin/:id", protectRoute, togglePinMessage)

export default messageRouter