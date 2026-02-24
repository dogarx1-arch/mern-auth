import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import transporter from '../config/nodemailer.js';
import { EMAIL_VERIFY_TEMPLATE, PASSWORD_RESET_TEMPLATE } from '../config/emailTemplates.js';

// --- Helper for consistent cookie settings across domains ---
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', 
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', 
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
};

// Register Controller
export const register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: "Missing Details" });
    }

    try {
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new userModel({
            name,
            email,
            password: hashedPassword,
        });
        await newUser.save();

        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, cookieOptions);

        // Welcome Email Logic
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Welcome to Our Platform!',
            text: `Hello ${name},\n\nThank you for registering. Your account has been successfully created.`
        };

        await transporter.sendMail(mailOptions);
        
        return res.json({ success: true, message: "User registered successfully" });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

// Login Controller
export const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required" });
    }
    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid email" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid password" });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, cookieOptions);
        
        return res.json({ success: true, message: "User logged in successfully" });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

// Logout Controller
export const logout = async (req, res) => {
    try {
        res.clearCookie('token', cookieOptions);
        return res.json({ success: true, message: "User logged out successfully" });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

// Send verification otp
export const sendVerifyOtp = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        if (user.isAccountVerified) {
            return res.status(400).json({ success: false, message: "Account already verified" });
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000; 

        await user.save();

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Verify Your Account',
            html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email),
        };

        await transporter.sendMail(mailOptions);
        return res.json({ success: true, message: "Verification OTP sent successfully" });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

// verify email using otp
export const verifyEmail = async (req, res) => {
    const userId = req.userId;
    const { otp } = req.body;

    if (!otp) {
        return res.status(400).json({ success: false, message: "Missing Details" });
    }

    try {
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }
        if (user.verifyOtp === '' || user.verifyOtp !== otp) {
            return res.status(400).json({ success: false, message: "Invalid OTP" });
        }
        if (user.verifyOtpExpireAt < Date.now()) {
            return res.status(400).json({ success: false, message: "OTP Expired" });
        }

        user.isAccountVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpireAt = 0;

        await user.save();
        return res.json({ success: true, message: "Email verified successfully" });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

// check if user is authenticated
export const isAuthenticated = async (req, res) => {
    try {
        return res.json({ success: true });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

// Send Password Reset Otp 
export const sendResetOtp = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
    }
    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

        await user.save();

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Password Reset OTP',
            html: PASSWORD_RESET_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email),
        };
        await transporter.sendMail(mailOptions);
        return res.json({ success: true, message: "Password reset OTP sent successfully" });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

// Reset Password using otp
export const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
        return res.status(400).json({ success: false, message: "Missing Details" });
    }
    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }
        if (user.resetOtp === '' || user.resetOtp !== otp) {
            return res.status(400).json({ success: false, message: "Invalid OTP" });
        }
        if (user.resetOtpExpireAt < Date.now()) {
            return res.status(400).json({ success: false, message: "OTP Expired" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetOtp = '';
        user.resetOtpExpireAt = 0;

        await user.save();
        return res.json({ success: true, message: "Password reset successfully" });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};