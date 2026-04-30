import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 6001;

console.log('Checking Environment Variables...');
if (!process.env.MONGO_URL) {
    console.error('CRITICAL ERROR: MONGO_URL is NOT defined in Environment Variables!');
} else {
    console.log('MONGO_URL found, attempting to connect...');
}

mongoose.connect(process.env.MONGO_URL)
    .then(() => {
        console.log('Admin Database Connected');
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Admin server running on port ${PORT}`);
        });
    })
    .catch((err) => console.error('Database connection failed:', err));
