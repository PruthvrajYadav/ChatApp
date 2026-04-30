import express from 'express'
import { checkAuth, login, Signup, updateProfile, deleteAccount, searchUserByPhone, addFriend } from '../controller/userController.js';
import { protectRoute } from '../middleware/auth.js';

const userRouter = express.Router();

userRouter.post('/signup', Signup)
userRouter.post('/login', login)
userRouter.put('/update-profile', protectRoute, updateProfile)
userRouter.delete('/delete-account', protectRoute, deleteAccount)
userRouter.get('/check', protectRoute, checkAuth)
userRouter.get('/search', protectRoute, searchUserByPhone)
userRouter.post('/add', protectRoute, addFriend)

export default userRouter