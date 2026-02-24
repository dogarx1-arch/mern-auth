import userModel from "../models/userModel.js";

export const getUserData = async (req, res) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.json({ success: false });
        }

        const user = await userModel.findById(userId);

        if (!user) {
            return res.json({ success: false });
        }

        res.json({
            success: true,
            userData: {
                name: user.name,
                isAccountVerified: user.isAccountVerified,
            },
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};