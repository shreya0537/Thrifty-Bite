const express = require("express");

const Order = require("../models/order");

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const { buildOrderDraft } = require("../utils/orderDraft");
const { razorpayEnabled } = require("./paymentRoutes");

const router = express.Router();

router.get("/test", (req, res) => {
    res.json({
        message: "Order route is working!"
    });
});


/* =========================================================
   PLACE ORDER (scoped to one restaurant)
   POST /api/order

   body: { restaurantId, addressId, paymentMethod, couponCode?,
           items: [{ menuItemId, quantity }] }

   The frontend cart is client-side (localStorage), so the
   client sends menuItemId + quantity and the server looks up
   each item's authoritative name/price/availability itself.
========================================================= */

router.post("/", authMiddleware, requireRole("CUSTOMER"), async (req, res) => {
    try {
        const paymentMethod = req.body.paymentMethod || "Cash";

        // UPI / Card must go through Razorpay (POST /api/payment/create-order)
        if (paymentMethod !== "Cash" && razorpayEnabled()) {
            return res.status(400).json({
                success: false,
                message: "Please complete the online payment to place a UPI/Card order."
            });
        }

        const draft = await buildOrderDraft(req.user.userId, req.body);

        if (!draft.ok) {
            return res.status(draft.status).json({
                success: false,
                message: draft.message
            });
        }

        const location = req.body.deliveryLocation;
        if (paymentMethod === "Cash" && (!location || !Number.isFinite(Number(location.latitude)) || !Number.isFinite(Number(location.longitude)) || Number(location.latitude) < -90 || Number(location.latitude) > 90 || Number(location.longitude) < -180 || Number(location.longitude) > 180)) {
            return res.status(400).json({ success: false, message: "Pin your delivery location on the map before placing a Cash on Delivery order." });
        }

        const order = await Order.create({
            ...draft.data,
            deliveryLocation: location ? { latitude: Number(location.latitude), longitude: Number(location.longitude) } : undefined,
            paymentStatus: "COD"
        });

        res.status(201).json({
            success: true,
            message: "Order placed successfully!",
            order: order
        });

    } catch (error) {
        console.error("Place order error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while placing order."
        });
    }
});


/* =========================================================
   MY ORDER HISTORY
   GET /api/order/my
========================================================= */

router.get("/my", authMiddleware, async (req, res) => {
    try {
        const orders = await Order.find({ customerId: req.user.userId })
            .populate("restaurantId", "name")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders: orders
        });

    } catch (error) {
        console.error("Get order history error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching order history."
        });
    }
});


/* =========================================================
   ORDER DETAIL
   GET /api/order/:id
========================================================= */

router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate("restaurantId", "name")
            .populate("customerId", "name username email");

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found."
            });
        }

        const isOwner = order.customerId._id.toString() === req.user.userId;
        const isRestaurant = order.restaurantId._id.toString() === req.user.userId;
        const isAdmin = req.user.role === "ADMIN";

        if (!isOwner && !isRestaurant && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this order."
            });
        }

        res.status(200).json({
            success: true,
            order: order
        });

    } catch (error) {
        console.error("Get order detail error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching order."
        });
    }
});

module.exports = router;
