import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import connectDB from '../config/mongodb.js';
import authRouter from '../routes/authRoutes.js';
import userRouter from '../routes/userRoutes.js';

const app = express();

const allowedOrigins = [
    'https://my-mern-auth.netlify.app',
    'http://localhost:5173'
];

const corsOptions = {
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
};

// CORS first — before everything else
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

// DB connection middleware
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error("DB connection failed:", error.message);
        return res.status(500).json({
            success: false,
            message: "Database connection failed: " + error.message
        });
    }
});

// Routes
app.get('/', (req, res) => res.send('API Working'));
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);

// Global error handler — keeps CORS headers even on crashes
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err.message);
    res.status(500).json({
        success: false,
        message: err.message || "Internal server error"
    });
});

if (process.env.NODE_ENV !== 'production') {
    const port = process.env.PORT || 4000;
    app.listen(port, () => console.log(`Server is running on port ${port}`));
}

export default app;