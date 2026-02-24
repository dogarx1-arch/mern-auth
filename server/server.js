import express from 'express';
import cors from 'cors';
import 'dotenv/config'; 
import cookieParser from 'cookie-parser';
import connectDB from './config/mongodb.js';
import authRouter from './routes/authRoutes.js';
import userRouter from './routes/userRoutes.js';

const app = express();

// Connect to MongoDB Atlas
connectDB();

// In server/server.js
const allowedOrigins = [
    'https://my-mern-auth.netlify.app', 
    'http://localhost:5173'
];

app.use(cors({ 
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }, 
    credentials: true 
}));

app.use(express.json());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(cookieParser());

// Routes
app.get('/', (req, res) => res.send('API Working'));
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);

// FIX FOR VERCEL: Only start the server if we are NOT on Vercel
if (process.env.NODE_ENV !== 'production') {
    const port = process.env.PORT || 4000;
    app.listen(port, () => console.log(`Server is running on port ${port}`));
}

// CRITICAL FOR VERCEL: You must export the app
export default app;