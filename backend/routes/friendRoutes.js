const express = require("express");

const User = require("../models/user");
const Friend = require("../models/friend");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);


/* =========================================================
   SEARCH USERS TO ADD AS FRIENDS
   GET /api/friends/search?query=
========================================================= */

router.get("/search", async (req, res) => {
    try {
        const query = (req.query.query || "").trim();

        if (!query) {
            return res.status(200).json({
                success: true,
                users: []
            });
        }

        const users = await User.find({
            _id: { $ne: req.user.userId },
            role: "CUSTOMER",
            $or: [
                { name: { $regex: query, $options: "i" } },
                { username: { $regex: query, $options: "i" } },
                { email: { $regex: query, $options: "i" } },
                { mobile: { $regex: query, $options: "i" } }
            ]
        }).select("name username email mobile");

        res.status(200).json({
            success: true,
            users: users
        });

    } catch (error) {
        console.error("Search friends error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while searching users."
        });
    }
});


/* =========================================================
   SEND FRIEND REQUEST
   POST /api/friends/request
========================================================= */

router.post("/request", async (req, res) => {
    try {
        const { recipientId } = req.body;

        if (!recipientId) {
            return res.status(400).json({
                success: false,
                message: "Recipient is required."
            });
        }

        if (recipientId === req.user.userId) {
            return res.status(400).json({
                success: false,
                message: "You cannot add yourself as a friend."
            });
        }

        const existing = await Friend.findOne({
            $or: [
                { requesterId: req.user.userId, recipientId },
                { requesterId: recipientId, recipientId: req.user.userId }
            ]
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "A friend request already exists between these users."
            });
        }

        const friendRequest = await Friend.create({
            requesterId: req.user.userId,
            recipientId
        });

        res.status(201).json({
            success: true,
            message: "Friend request sent!",
            request: friendRequest
        });

    } catch (error) {
        console.error("Send friend request error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while sending friend request."
        });
    }
});


/* =========================================================
   PENDING INCOMING REQUESTS
   GET /api/friends/requests
========================================================= */

router.get("/requests", async (req, res) => {
    try {
        const requests = await Friend.find({
            recipientId: req.user.userId,
            status: "PENDING"
        }).populate("requesterId", "name username email mobile");

        res.status(200).json({
            success: true,
            requests: requests
        });

    } catch (error) {
        console.error("Get friend requests error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching friend requests."
        });
    }
});


/* =========================================================
   ACCEPT / REJECT FRIEND REQUEST
   PUT /api/friends/request/:id/accept
   PUT /api/friends/request/:id/reject
========================================================= */

router.put("/request/:id/accept", async (req, res) => {
    try {
        const request = await Friend.findOneAndUpdate(
            {
                _id: req.params.id,
                recipientId: req.user.userId,
                status: "PENDING"
            },
            { $set: { status: "ACCEPTED" } },
            { new: true }
        );

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Friend request not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Friend request accepted!",
            request: request
        });

    } catch (error) {
        console.error("Accept friend request error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while accepting friend request."
        });
    }
});

router.put("/request/:id/reject", async (req, res) => {
    try {
        const request = await Friend.findOneAndUpdate(
            {
                _id: req.params.id,
                recipientId: req.user.userId,
                status: "PENDING"
            },
            { $set: { status: "REJECTED" } },
            { new: true }
        );

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Friend request not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Friend request rejected.",
            request: request
        });

    } catch (error) {
        console.error("Reject friend request error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while rejecting friend request."
        });
    }
});


/* =========================================================
   MY FRIENDS LIST
   GET /api/friends
========================================================= */

router.get("/", async (req, res) => {
    try {
        const friendships = await Friend.find({
            status: "ACCEPTED",
            $or: [
                { requesterId: req.user.userId },
                { recipientId: req.user.userId }
            ]
        })
            .populate("requesterId", "name username email mobile")
            .populate("recipientId", "name username email mobile");

        const friends = friendships.map((f) => {
            const isRequester = f.requesterId._id.toString() === req.user.userId;
            return isRequester ? f.recipientId : f.requesterId;
        });

        res.status(200).json({
            success: true,
            friends: friends
        });

    } catch (error) {
        console.error("Get friends list error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching friends."
        });
    }
});


console.log("FRIEND ROUTES LOADED");

module.exports = router;
