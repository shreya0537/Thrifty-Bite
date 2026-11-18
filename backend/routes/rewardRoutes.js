const express = require("express");

const RewardTransaction = require("../models/rewardTransaction");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);


/* =========================================================
   MY REWARDS (total points + history)
   GET /api/rewards
========================================================= */

router.get("/", async (req, res) => {
    try {
        const transactions = await RewardTransaction.find({
            userId: req.user.userId
        }).sort({ createdAt: -1 });

        const totalPoints = transactions.reduce(
            (sum, t) => sum + t.points,
            0
        );

        res.status(200).json({
            success: true,
            totalPoints: totalPoints,
            transactions: transactions
        });

    } catch (error) {
        console.error("Get rewards error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching rewards."
        });
    }
});


console.log("REWARD ROUTES LOADED");

module.exports = router;
