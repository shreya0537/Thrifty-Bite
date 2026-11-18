const express = require("express");

const CustomOrder = require("../models/customOrder");
const ChefProposal = require("../models/chefProposal");
const CustomOrderPayment = require("../models/customOrderPayment");
const CustomOrderStatusHistory = require("../models/customOrderStatusHistory");
const User = require("../models/user");
const ChefProfile = require("../models/chefProfile");

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const logCustomOrderStatus = require("../utils/customOrderHistory");
const awardRewardPoints = require("../utils/awardRewardPoints");

const router = express.Router();

router.use(authMiddleware);


/* =========================================================
   LIST MASTER CHEFS (for the optional "prefer a chef" picker)
   GET /api/custom-orders/chefs
========================================================= */

router.get("/chefs", async (req, res) => {
    try {
        const chefs = await User.find({
            role: "MASTER_CHEF",
            isActive: true
        }).select("name username");

        const profiles = await ChefProfile.find({
            userId: { $in: chefs.map((c) => c._id) }
        });

        const profileByUserId = {};
        profiles.forEach((p) => { profileByUserId[p.userId.toString()] = p; });

        const result = chefs.map((c) => ({
            _id: c._id,
            name: c.name || c.username,
            specialization: (profileByUserId[c._id.toString()] || {}).specialization || ""
        }));

        res.status(200).json({
            success: true,
            chefs: result
        });

    } catch (error) {
        console.error("List chefs error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching chefs."
        });
    }
});


/* =========================================================
   CREATE CUSTOM FOOD REQUEST
   POST /api/custom-orders
========================================================= */

router.post("/", requireRole("CUSTOMER"), async (req, res) => {
    try {
        const {
            chefId,
            foodRequired,
            description,
            quantity,
            preferredDate,
            preferredTime,
            specialInstructions,
            referenceImage
        } = req.body;

        if (!foodRequired || !description || !preferredDate || !preferredTime) {
            return res.status(400).json({
                success: false,
                message: "Food required, description, preferred date and time are required."
            });
        }

        const order = await CustomOrder.create({
            customerId: req.user.userId,
            chefId: chefId || null,
            foodRequired,
            description,
            quantity: quantity || 1,
            preferredDate,
            preferredTime,
            specialInstructions: specialInstructions || "",
            referenceImage: referenceImage || ""
        });

        await logCustomOrderStatus(order._id, "REQUESTED", req.user.userId);

        res.status(201).json({
            success: true,
            message: "Custom order request submitted!",
            order: order
        });

    } catch (error) {
        console.error("Create custom order error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while creating custom order."
        });
    }
});


/* =========================================================
   MY CUSTOM ORDERS
   GET /api/custom-orders/my
========================================================= */

router.get("/my", requireRole("CUSTOMER"), async (req, res) => {
    try {
        const orders = await CustomOrder.find({
            customerId: req.user.userId
        })
            .populate("chefId", "name username email mobile")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders: orders
        });

    } catch (error) {
        console.error("Get my custom orders error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching custom orders."
        });
    }
});


/* =========================================================
   CUSTOM ORDER DETAIL (order + latest proposal + payment)
   GET /api/custom-orders/:id
========================================================= */

router.get("/:id", async (req, res) => {
    try {
        const order = await CustomOrder.findById(req.params.id)
            .populate("customerId", "name username email mobile")
            .populate("chefId", "name username email mobile");

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Custom order not found."
            });
        }

        const isOwner = order.customerId._id.toString() === req.user.userId;
        const isChef = order.chefId && order.chefId._id.toString() === req.user.userId;
        const isAdmin = req.user.role === "ADMIN";

        if (!isOwner && !isChef && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this order."
            });
        }

        const proposal = await ChefProposal.findOne({
            customOrderId: order._id
        }).sort({ createdAt: -1 });

        const payment = await CustomOrderPayment.findOne({
            customOrderId: order._id
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            order: order,
            proposal: proposal,
            payment: payment
        });

    } catch (error) {
        console.error("Get custom order detail error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching custom order."
        });
    }
});


/* =========================================================
   STATUS TIMELINE
   GET /api/custom-orders/:id/timeline
========================================================= */

router.get("/:id/timeline", async (req, res) => {
    try {
        const history = await CustomOrderStatusHistory.find({
            customOrderId: req.params.id
        }).sort({ updatedAt: 1 });

        res.status(200).json({
            success: true,
            timeline: history
        });

    } catch (error) {
        console.error("Get timeline error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching timeline."
        });
    }
});


/* =========================================================
   REJECT CHEF PROPOSAL
   POST /api/custom-orders/:id/reject
========================================================= */

router.post("/:id/reject", requireRole("CUSTOMER"), async (req, res) => {
    try {
        const order = await CustomOrder.findOne({
            _id: req.params.id,
            customerId: req.user.userId,
            status: "CHEF_PROPOSED"
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found or not awaiting your decision."
            });
        }

        order.status = "REJECTED";
        await order.save();

        await ChefProposal.updateMany(
            { customOrderId: order._id },
            { $set: { proposalStatus: "REJECTED" } }
        );

        await logCustomOrderStatus(order._id, "REJECTED", req.user.userId);

        res.status(200).json({
            success: true,
            message: "Proposal rejected.",
            order: order
        });

    } catch (error) {
        console.error("Reject proposal error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while rejecting proposal."
        });
    }
});


/* =========================================================
   CONFIRM & PAY (mock payment)
   POST /api/custom-orders/:id/payment
========================================================= */

router.post("/:id/payment", requireRole("CUSTOMER"), async (req, res) => {
    try {
        const { paymentMethod } = req.body;

        if (!["UPI", "Card", "Cash"].includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: "A valid payment method is required."
            });
        }

        const order = await CustomOrder.findOne({
            _id: req.params.id,
            customerId: req.user.userId,
            status: "CHEF_PROPOSED"
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found or not awaiting payment."
            });
        }

        const proposal = await ChefProposal.findOne({
            customOrderId: order._id
        }).sort({ createdAt: -1 });

        if (!proposal) {
            return res.status(404).json({
                success: false,
                message: "No proposal found for this order."
            });
        }

        const payment = await CustomOrderPayment.create({
            customOrderId: order._id,
            customerId: req.user.userId,
            amount: proposal.amount,
            paymentMethod,
            paymentStatus: "PAID",
            paymentDate: new Date()
        });

        proposal.proposalStatus = "ACCEPTED";
        await proposal.save();

        order.status = "CONFIRMED";
        await order.save();

        await logCustomOrderStatus(order._id, "CONFIRMED", req.user.userId, "Payment completed");

        await awardRewardPoints(
            req.user.userId,
            payment.amount,
            "Custom order #" + order._id.toString().slice(-6) + " paid",
            order._id,
            "CustomOrder"
        );

        res.status(200).json({
            success: true,
            message: "Payment successful! Order confirmed.",
            order: order,
            payment: payment
        });

    } catch (error) {
        console.error("Custom order payment error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while processing payment."
        });
    }
});


console.log("CUSTOM ORDER ROUTES LOADED");

module.exports = router;
