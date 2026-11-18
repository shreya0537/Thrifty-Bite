const express = require("express");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const User = require("../models/user");
const authMiddleware = require("../middleware/authMiddleware");
const uploadAvatar = require("../middleware/uploadAvatar");

const router = express.Router();

const deleteAvatarFile = (avatarPath) => {
    if (!avatarPath || !avatarPath.startsWith("/uploads/avatars/")) {
        return;
    }

    const fullPath = path.join(__dirname, "..", avatarPath);

    fs.unlink(fullPath, (err) => {
        if (err && err.code !== "ENOENT") {
            console.error("Failed to delete old avatar:", err.message);
        }
    });
};

// GET logged-in user's profile
router.get("/", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        res.status(200).json({
            success: true,
            user: user
        });

    } catch (error) {
        console.error("Profile fetch error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching profile."
        });
    }
});


/* =========================================================
   UPLOAD PROFILE PICTURE
   POST /api/profile/avatar   (multipart/form-data, field "avatar")
========================================================= */

router.post("/avatar", authMiddleware, (req, res) => {
    uploadAvatar.single("avatar")(req, res, async (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message || "Unable to upload image."
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image file was provided."
            });
        }

        try {
            const user = await User.findById(req.user.userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found."
                });
            }

            const oldAvatar = user.avatar;
            user.avatar = "/uploads/avatars/" + req.file.filename;
            await user.save();

            deleteAvatarFile(oldAvatar);

            res.status(200).json({
                success: true,
                message: "Profile picture updated!",
                avatar: user.avatar
            });

        } catch (error) {
            console.error("Avatar upload error:", error);

            res.status(500).json({
                success: false,
                message: "Server error while saving profile picture."
            });
        }
    });
});


/* =========================================================
   REMOVE PROFILE PICTURE
   DELETE /api/profile/avatar
========================================================= */

router.delete("/avatar", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        deleteAvatarFile(user.avatar);

        user.avatar = "";
        await user.save();

        res.status(200).json({
            success: true,
            message: "Profile picture removed."
        });

    } catch (error) {
        console.error("Avatar remove error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while removing profile picture."
        });
    }
});


/* =========================================================
   UPDATE PROFILE (name, mobile, address)
   PUT /api/profile
========================================================= */

router.put("/", authMiddleware, async (req, res) => {
    try {
        const { name, mobile, address } = req.body;

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        if (name !== undefined) user.name = name.trim();
        if (mobile !== undefined) user.mobile = mobile.trim();
        if (address !== undefined) user.address = address.trim();

        await user.save();

        res.status(200).json({
            success: true,
            message: "Profile updated successfully!",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                name: user.name,
                mobile: user.mobile,
                address: user.address,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Profile update error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while updating profile."
        });
    }
});


/* =========================================================
   CHANGE PASSWORD
   PUT /api/profile/password
========================================================= */

router.put("/password", authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Current and new password are required."
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 8 characters."
            });
        }

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const passwordMatch = await bcrypt.compare(currentPassword, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect."
            });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password changed successfully!"
        });

    } catch (error) {
        console.error("Password change error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while changing password."
        });
    }
});

module.exports = router;
