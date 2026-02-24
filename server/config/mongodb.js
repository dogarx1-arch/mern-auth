import mongoose from "mongoose";

let isConnected = false;

const connectDB = async () => {
    if (isConnected) return;

    try {
        const db = await mongoose.connect(process.env.MONGODB_URI);
        isConnected = db.connections[0].readyState === 1;
        console.log("MongoDB connected");
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        // Don't call process.exit(1) — it kills the serverless function
        throw error; // let the route handler return a proper 500 instead
    }
};

export default connectDB;