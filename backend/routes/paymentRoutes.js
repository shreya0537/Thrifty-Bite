const express = require("express");
const crypto = require("crypto");
const os = require("os");

const Order = require("../models/order");
const User = require("../models/user");
const PaymentSession = require("../models/paymentSession");

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const { buildOrderDraft } = require("../utils/orderDraft");

const router = express.Router();

/* =========================================================
   RAZORPAY (TEST MODE)
   Keys come from backend/.env:
     RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
     RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
   The secret never leaves the server.
========================================================= */

function razorpayKeys() {
    return {
        keyId: (process.env.RAZORPAY_KEY_ID || "").trim(),
        keySecret: (process.env.RAZORPAY_KEY_SECRET || "").trim()
    };
}

function razorpayEnabled() {
    const { keyId, keySecret } = razorpayKeys();
    return Boolean(keyId && keySecret);
}

/* Without Razorpay keys (and outside production) a built-in demo
   payment is used so UPI/Card checkout can still be shown working.
   No money moves; orders are marked with a "demo_" payment ID. */
function demoPaymentEnabled() {
    return process.env.NODE_ENV !== "production";
}

async function createRazorpayOrder(amountPaise, receipt, notes) {
    const { keyId, keySecret } = razorpayKeys();

    const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Basic " + Buffer.from(keyId + ":" + keySecret).toString("base64")
        },
        body: JSON.stringify({
            amount: amountPaise,
            currency: "INR",
            receipt,
            notes
        })
    });

    const data = await response.json();

    if (!response.ok) {
        const reason = data && data.error ? data.error.description : response.statusText;
        throw new Error("Razorpay: " + reason);
    }

    return data;
}


/* =========================================================
   CONFIG (public key only)
   GET /api/payment/config
========================================================= */

router.get("/config", (req, res) => {
    const { keyId } = razorpayKeys();

    res.status(200).json({
        success: true,
        enabled: razorpayEnabled(),
        demoMode: demoPaymentEnabled(),
        keyId: razorpayEnabled() ? keyId : null,
        testMode: keyId.startsWith("rzp_test_")
    });
});


/* =========================================================
   CREATE RAZORPAY ORDER
   POST /api/payment/create-order
   body: same as POST /api/order
========================================================= */

router.post("/create-order", authMiddleware, requireRole("CUSTOMER"), async (req, res) => {
    try {
        if (!razorpayEnabled()) {
            return res.status(503).json({
                success: false,
                message: "Online payment is not set up yet. Please choose Cash on Delivery."
            });
        }

        const draft = await buildOrderDraft(req.user.userId, req.body);

        if (!draft.ok) {
            return res.status(draft.status).json({
                success: false,
                message: draft.message
            });
        }

        const amountPaise = Math.round(draft.data.totalAmount * 100);

        if (amountPaise < 100) {
            return res.status(400).json({
                success: false,
                message: "Online payment needs a total of at least ₹1."
            });
        }

        const razorpayOrder = await createRazorpayOrder(
            amountPaise,
            "tb_" + Date.now(),
            { customerId: String(req.user.userId), restaurantId: String(draft.data.restaurantId) }
        );

        await PaymentSession.create({
            customerId: req.user.userId,
            razorpayOrderId: razorpayOrder.id,
            amount: amountPaise,
            orderData: draft.data
        });

        res.status(200).json({
            success: true,
            keyId: razorpayKeys().keyId,
            razorpayOrderId: razorpayOrder.id,
            amount: amountPaise,
            currency: "INR",
            prefill: {
                name: draft.data.deliveryAddress.fullName,
                contact: draft.data.deliveryAddress.phone
            }
        });

    } catch (error) {
        console.error("Create Razorpay order error:", error);

        res.status(500).json({
            success: false,
            message: error.message && error.message.startsWith("Razorpay:")
                ? error.message
                : "Server error while starting the payment."
        });
    }
});


/* =========================================================
   VERIFY PAYMENT + PLACE ORDER
   POST /api/payment/verify
   body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
========================================================= */

router.post("/verify", authMiddleware, requireRole("CUSTOMER"), async (req, res) => {
    try {
        const {
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: razorpayPaymentId,
            razorpay_signature: signature
        } = req.body;

        if (!razorpayOrderId || !razorpayPaymentId || !signature) {
            return res.status(400).json({
                success: false,
                message: "Payment details are missing."
            });
        }

        // Signature proves the payment really came from Razorpay
        const expected = crypto
            .createHmac("sha256", razorpayKeys().keySecret)
            .update(razorpayOrderId + "|" + razorpayPaymentId)
            .digest("hex");

        const valid = expected.length === signature.length &&
            crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));

        if (!valid) {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed."
            });
        }

        const session = await PaymentSession.findOne({
            razorpayOrderId,
            customerId: req.user.userId
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Payment session not found."
            });
        }

        // Already handled (e.g. the page retried) — return the same order
        if (session.status === "PAID" && session.orderId) {
            const existing = await Order.findById(session.orderId);
            return res.status(200).json({
                success: true,
                message: "Payment successful! Order placed.",
                order: existing
            });
        }

        // Claim the session atomically so a double submit can't create two orders
        const claimed = await PaymentSession.findOneAndUpdate(
            { _id: session._id, status: "CREATED" },
            { status: "PROCESSING" },
            { new: true }
        );

        if (!claimed) {
            return res.status(409).json({
                success: false,
                message: "This payment is already being processed. Check My Orders in a moment."
            });
        }

        const order = await Order.create({
            ...session.orderData,
            paymentStatus: "PAID",
            razorpayOrderId,
            razorpayPaymentId
        });

        claimed.status = "PAID";
        claimed.orderId = order._id;
        await claimed.save();

        res.status(201).json({
            success: true,
            message: "Payment successful! Order placed.",
            order: order
        });

    } catch (error) {
        console.error("Verify Razorpay payment error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while verifying the payment."
        });
    }
});

/* =========================================================
   DEMO UPI QR PAYMENT (only when Razorpay keys are not set)
   Works like Razorpay's UPI QR screen:
   1. POST /demo/create        -> session + QR for upi-payment.html
   2. phone scans QR -> pay-confirm.html -> POST /demo/confirm
   3. upi-payment.html polls GET /demo/status/:id, then shows
      payment-success.html
   The QR never contains a real UPI link, so no money can move.
========================================================= */

const DEMO_QR_LIFETIME_MS = 5 * 60 * 1000;

/* Address a phone on the same Wi-Fi can open (localhost only works
   on the computer itself). Falls back to null if none is found. */
function lanBaseUrl() {
    const port = process.env.PORT || 5500;

    for (const addresses of Object.values(os.networkInterfaces())) {
        for (const addr of addresses || []) {
            if (addr.family === "IPv4" && !addr.internal && !addr.address.startsWith("169.254.")) {
                return "http://" + addr.address + ":" + port;
            }
        }
    }

    return null;
}

function sessionIsExpired(session) {
    return session.expiresAt && session.expiresAt < new Date();
}

router.post("/demo/create", authMiddleware, requireRole("CUSTOMER"), async (req, res) => {
    try {
        if (!demoPaymentEnabled()) {
            return res.status(400).json({
                success: false,
                message: "Demo payment is not available. Please use Razorpay."
            });
        }

        const draft = await buildOrderDraft(req.user.userId, req.body);

        if (!draft.ok) {
            return res.status(draft.status).json({
                success: false,
                message: draft.message
            });
        }

        const restaurant = await User.findById(draft.data.restaurantId).select("name");

        const session = await PaymentSession.create({
            customerId: req.user.userId,
            razorpayOrderId: "demo_" + crypto.randomBytes(16).toString("hex"),
            amount: Math.round(draft.data.totalAmount * 100),
            orderData: draft.data,
            paymentMethod: draft.data.paymentMethod,
            restaurantName: restaurant ? restaurant.name : "",
            expiresAt: new Date(Date.now() + DEMO_QR_LIFETIME_MS)
        });

        res.status(201).json({
            success: true,
            sessionId: session.razorpayOrderId
        });

    } catch (error) {
        console.error("Demo payment create error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while starting the payment."
        });
    }
});

/* Public session summary — used by the QR page and the phone page.
   The session id is a long random value, so it can't be guessed. */
router.get("/demo/session/:id", async (req, res) => {
    try {
        const session = await PaymentSession.findOne({ razorpayOrderId: req.params.id });

        if (!session || !session.razorpayOrderId.startsWith("demo_")) {
            return res.status(404).json({
                success: false,
                message: "Payment session not found."
            });
        }

        res.status(200).json({
            success: true,
            session: {
                sessionId: session.razorpayOrderId,
                amount: session.amount / 100,
                restaurantName: session.restaurantName,
                paymentMethod: session.paymentMethod,
                status: sessionIsExpired(session) && session.status === "CREATED" ? "EXPIRED" : session.status,
                expiresAt: session.expiresAt,
                orderId: session.orderId,
                orderSummary: {
                    items: Array.isArray(session.orderData && session.orderData.items)
                        ? session.orderData.items.map(item => ({ name: item.name || "Item", quantity: Number(item.quantity) || 1, price: Number(item.price) || 0 }))
                        : [],
                    totalAmount: Number(session.orderData && session.orderData.totalAmount) || (session.amount / 100),
                    paymentMethod: session.paymentMethod || (session.orderData && session.orderData.paymentMethod) || "UPI",
                    orderDate: session.createdAt
                }
            },
            lanBaseUrl: lanBaseUrl()
        });

    } catch (error) {
        console.error("Demo payment session error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while loading the payment."
        });
    }
});

/* "Pay" / "Decline" from the phone (or the simulate buttons) */
router.post("/demo/confirm", async (req, res) => {
    try {
        const { sessionId, outcome } = req.body;
        if (!sessionId || !["success", "failure"].includes(String(outcome || "").toLowerCase())) {
            return res.status(400).json({ success: false, message: "Choose simulated payment success or failure." });
        }

        const normalizedOutcome = String(outcome).toLowerCase();
        const session = await PaymentSession.findOne({ razorpayOrderId: sessionId });

        if (!session || !String(sessionId).startsWith("demo_")) {
            return res.status(404).json({
                success: false,
                message: "Payment session not found."
            });
        }

        if (session.status === "PAID") {
            return res.status(200).json({
                success: true,
                status: "PAID",
                orderId: session.orderId
            });
        }

        // Demo sessions can be retried during testing, including after the QR
        // timer expires. This endpoint only accepts demo_ IDs; real Razorpay
        // sessions cannot be reopened here. A PAID session remains immutable.
        if (session.status === "FAILED" || (session.status === "CREATED" && sessionIsExpired(session))) {
            const reopened = await PaymentSession.findOneAndUpdate(
                { _id: session._id, status: session.status },
                { status: "CREATED", expiresAt: new Date(Date.now() + DEMO_QR_LIFETIME_MS) },
                { new: true }
            );
            if (reopened) {
                session.status = "CREATED";
                session.expiresAt = reopened.expiresAt;
            }
        }

        if (session.status !== "CREATED") {
            return res.status(409).json({
                success: false,
                message: session.status === "PROCESSING"
                    ? "This demo payment is already being processed. Refresh your orders before trying again."
                    : "This demo payment has already failed. Start checkout again to create a new payment session."
            });
        }

        if (sessionIsExpired(session)) {
            return res.status(400).json({
                success: false,
                message: "This QR code has expired. Please start the payment again."
            });
        }

        if (normalizedOutcome === "failure") {
            await PaymentSession.updateOne({ _id: session._id, status: "CREATED" }, { status: "FAILED" });

            return res.status(200).json({
                success: true,
                status: "FAILED"
            });
        }

        // Claim atomically so a double tap can't create two orders
        const claimed = await PaymentSession.findOneAndUpdate(
            { _id: session._id, status: "CREATED" },
            { status: "PROCESSING" },
            { new: true }
        );

        if (!claimed) {
            return res.status(409).json({
                success: false,
                message: "This payment is already being processed."
            });
        }

        const order = await Order.create({
            ...claimed.orderData,
            paymentStatus: "PAID",
            razorpayOrderId: claimed.razorpayOrderId,
            razorpayPaymentId: "demo_pay_" + crypto.randomBytes(7).toString("hex")
        });

        claimed.status = "PAID";
        claimed.orderId = order._id;
        await claimed.save();

        res.status(200).json({
            success: true,
            status: "PAID",
            orderId: order._id
        });

    } catch (error) {
        console.error("Demo payment confirm error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while completing the payment."
        });
    }
});


module.exports = router;
module.exports.razorpayEnabled = razorpayEnabled;
