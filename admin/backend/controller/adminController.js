import User from '../model/user.js';
import Message from '../model/message.js';
import Group from '../model/group.js';
import jwt from 'jsonwebtoken';

export const adminLogin = async (req, res) => {
    const { email, password } = req.body;
    
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
        return res.json({ success: true, token });
    }
    
    res.status(401).json({ success: false, message: 'Invalid Admin Credentials' });
};

export const getStats = async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const messageCount = await Message.countDocuments();
        const groupCount = await Group.countDocuments();
        
        // Calculate active users (active in the last 10 minutes)
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const activeUsers = await User.countDocuments({ lastSeen: { $gte: tenMinutesAgo } });
        
        res.json({
            success: true,
            stats: {
                users: userCount,
                messages: messageCount,
                groups: groupCount,
                active: activeUsers
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await User.findByIdAndDelete(id);
        // Also delete their messages? Optional, but good for cleanup
        await Message.deleteMany({ senderId: id });
        res.json({ success: true, message: 'User and their messages deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllGroups = async (req, res) => {
    try {
        const groups = await Group.find().populate('members', 'fullName email');
        res.json({ success: true, groups });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteGroup = async (req, res) => {
    try {
        const { id } = req.params;
        await Group.findByIdAndDelete(id);
        await Message.deleteMany({ groupId: id });
        res.json({ success: true, message: 'Group and its messages deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
