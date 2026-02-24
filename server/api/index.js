import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
// Fixed paths: Going up one level to find the folders
import connectDB from '../config/mongodb.js';
import authRouter from '../routes/authRoutes.js';
import userRouter from '../routes/userRoutes.js';

const app = express();

// Connect to MongoDB Atlas
connectDB();

const allowedOrigins = [
    'https://my-mern-auth.netlify.app',
    'http://localhost:5173'
];

// Combine into one clean CORS configuration
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(cookieParser());

// Routes
app.get('/', (req, res) => res.send('API Working'));
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);

// Vercel only starts the server if it's NOT in production
if (process.env.NODE_ENV !== 'production') {
    const port = process.env.PORT || 4000;
    app.listen(port, () => console.log(`Server is running on port ${port}`));
}

// CRITICAL: Export the app for Vercel's serverless handler
export default app;