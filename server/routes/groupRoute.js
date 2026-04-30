import express from 'express'
import { protectRoute } from '../middleware/auth.js'
import { 
    addMembers, 
    createGroup, 
    getGroupMessages, 
    getMyGroups, 
    sendGroupMessage, 
    updateGroup,
    promoteToAdmin,
    removeMember
} from '../controller/groupController.js'

const groupRouter = express.Router()

groupRouter.post("/create", protectRoute, createGroup)
groupRouter.get("/my-groups", protectRoute, getMyGroups)
groupRouter.get("/messages/:groupId", protectRoute, getGroupMessages)
groupRouter.post("/send/:groupId", protectRoute, sendGroupMessage)
groupRouter.put("/update/:groupId", protectRoute, updateGroup)
groupRouter.put("/add-members/:groupId", protectRoute, addMembers)
groupRouter.put("/promote/:groupId/:memberId", protectRoute, promoteToAdmin)
groupRouter.delete("/remove/:groupId/:memberId", protectRoute, removeMember)

export default groupRouter
