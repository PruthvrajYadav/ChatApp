import express from 'express';
import { 
    adminLogin, 
    getStats, 
    getAllUsers, 
    deleteUser, 
    getAllGroups, 
    deleteGroup 
} from '../controller/adminController.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

router.post('/login', adminLogin);

// Protected routes
router.get('/stats', adminAuth, getStats);
router.get('/users', adminAuth, getAllUsers);
router.delete('/users/:id', adminAuth, deleteUser);
router.get('/groups', adminAuth, getAllGroups);
router.delete('/groups/:id', adminAuth, deleteGroup);

export default router;
