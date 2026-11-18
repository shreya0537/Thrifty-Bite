const express = require("express");

const User = require("../models/user");
const ChefProfile = require("../models/chefProfile");
const CustomOrder = require("../models/customOrder");
const ChefProposal = require("../models/chefProposal");

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const logCustomOrderStatus = require("../utils/customOrderHistory");

const router = express.Router();

router.use(authMiddleware, requireRole("MASTER_CHEF"));


/* =========================================================
   CHEF PROFILE
   GET /api/chef/profile
========================================================= */

router.get("/profile", async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-password");
        const profile = await ChefProfile.findOne({ userId: req.user.userId });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Chef not found."
            });
        }

        res.status(200).json({
            success: true,
            chef: user,
            profile: profile
        });

    } catch (error) {
        console.error("Get chef profile error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching chef profile."
        });
    }
});


/* =========================================================
   UPDATE CHEF PROFILE
   PUT /api/chef/profile
========================================================= */

router.put("/profile", async (req, res) => {
    try {
        const {
            name,
            mobile,
            address,
            specialization,
            experience,
            description
        } = req.body;

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Chef not found."
            });
        }

        if (name !== undefined) user.name = name;
        if (mobile !== undefined) user.mobile = mobile;
        if (address !== undefined) user.address = address;

        await user.save();

        const profile = await ChefProfile.findOneAndUpdate(
            { userId: req.user.userId },
            {
                $set: {
                    ...(specialization !== undefined && { specialization }),
                    ...(experience !== undefined && { experience }),
                    ...(description !== undefined && { description })
                }
            },
            { new: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            message: "Chef profile updated successfully!",
            profile: profile
        });

    } catch (error) {
        console.error("Update chef profile error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while updating chef profile."
        });
    }
});


/* =========================================================
   VIEW CUSTOM FOOD REQUESTS
   GET /api/chef/requests
========================================================= */

router.get("/requests", async (req, res) => {
    try {
        const openRequests = await CustomOrder.find({
            status: "REQUESTED",
            chefId: null
        })
            .populate("customerId", "name username email mobile")
            .sort({ createdAt: -1 });

        const myRequests = await CustomOrder.find({
            chefId: req.user.userId
        })
            .populate("customerId", "name username email mobile")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            openRequests: openRequests,
            myRequests: myRequests
        });

    } catch (error) {
        console.error("Get chef requests error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching custom requests."
        });
    }
});


/* =========================================================
   ACCEPT CUSTOM REQUEST
   POST /api/chef/requests/:id/accept
========================================================= */

router.post("/requests/:id/accept", async (req, res) => {
    try {
        const order = await CustomOrder.findOneAndUpdate(
            {
                _id: req.params.id,
                status: "REQUESTED",
                $or: [{ chefId: null }, { chefId: req.user.userId }]
            },
            {
                $set: {
                    chefId: req.user.userId,
                    status: "CHEF_ACCEPTED"
                }
            },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Request not found or already handled."
            });
        }

        await logCustomOrderStatus(order._id, "CHEF_ACCEPTED", req.user.userId);

        res.status(200).json({
            success: true,
            message: "Request accepted!",
            order: order
        });

    } catch (error) {
        console.error("Accept request error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while accepting request."
        });
    }
});


/* =========================================================
   REJECT CUSTOM REQUEST
   POST /api/chef/requests/:id/reject
========================================================= */

router.post("/requests/:id/reject", async (req, res) => {
    try {
        const order = await CustomOrder.findOneAndUpdate(
            {
                _id: req.params.id,
                status: { $in: ["REQUESTED", "CHEF_ACCEPTED"] },
                $or: [{ chefId: null }, { chefId: req.user.userId }]
            },
            {
                $set: { status: "REJECTED" }
            },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Request not found or already handled."
            });
        }

        await logCustomOrderStatus(
            order._id,
            "REJECTED",
            req.user.userId,
            req.body.remarks || ""
        );

        res.status(200).json({
            success: true,
            message: "Request rejected.",
            order: order
        });

    } catch (error) {
        console.error("Reject request error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while rejecting request."
        });
    }
});


/* =========================================================
   SEND PROPOSAL (AMOUNT + TIMELINE)
   POST /api/chef/requests/:id/proposal
========================================================= */

router.post("/requests/:id/proposal", async (req, res) => {
    try {
        const { amount, preparationTime, chefNotes } = req.body;

        if (amount === undefined || !preparationTime) {
            return res.status(400).json({
                success: false,
                message: "Amount and preparation time are required."
            });
        }

        const order = await CustomOrder.findOne({
            _id: req.params.id,
            chefId: req.user.userId,
            status: "CHEF_ACCEPTED"
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Request not found or not ready for a proposal."
            });
        }

        const proposal = await ChefProposal.create({
            customOrderId: order._id,
            chefId: req.user.userId,
            amount,
            preparationTime,
            chefNotes: chefNotes || ""
        });

        order.status = "CHEF_PROPOSED";
        await order.save();

        await logCustomOrderStatus(order._id, "CHEF_PROPOSED", req.user.userId);

        res.status(201).json({
            success: true,
            message: "Proposal sent to customer!",
            proposal: proposal,
            order: order
        });

    } catch (error) {
        console.error("Send proposal error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while sending proposal."
        });
    }
});


/* =========================================================
   UPDATE PREPARATION STATUS
   PUT /api/chef/orders/:id/status
========================================================= */

const ALLOWED_STATUSES = [
    "PREPARING",
    "READY",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "COMPLETED"
];

router.put("/orders/:id/status", async (req, res) => {
    try {
        const { status } = req.body;

        if (!ALLOWED_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid preparation status."
            });
        }

        const order = await CustomOrder.findOne({
            _id: req.params.id,
            chefId: req.user.userId
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found."
            });
        }

        order.status = status;
        await order.save();

        await logCustomOrderStatus(order._id, status, req.user.userId);

        res.status(200).json({
            success: true,
            message: "Order status updated successfully!",
            order: order
        });

    } catch (error) {
        console.error("Update preparation status error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while updating status."
        });
    }
});


console.log("CHEF ROUTES LOADED");

module.exports = router;
