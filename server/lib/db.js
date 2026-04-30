import mongoose from "mongoose";

export const connectDB = async () => {
    if (!process.env.MONGO_URL) {
        console.error("MONGO_URL is not defined in .env file");
        process.exit(1);
    }
    try {
        const maskedUrl = process.env.MONGO_URL.replace(/:([^:@]+)@/, ":****@");
        console.log(`Connecting to: ${maskedUrl}`);
        const conn = await mongoose.connect(process.env.MONGO_URL, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
};
