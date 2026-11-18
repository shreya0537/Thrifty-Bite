const mongoose = require("mongoose");

/* =========================================================
   PAYMENT SESSION
   Holds a checked order draft between "create Razorpay order"
   and "payment verified". The real Order is only created once
   Razorpay confirms the payment, so unpaid orders never reach
   the restaurant.
========================================================= */

const paymentSessionSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        razorpayOrderId: {
            type: String,
            required: true,
            unique: true
        },

        amount: {
            type: Number,   // in paise
            required: true
        },

        orderData: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },

        status: {
            type: String,
            enum: ["CREATED", "PROCESSING", "PAID", "FAILED"],
            default: "CREATED"
        },

        // Demo QR sessions expire (like Razorpay's QR timer)
        expiresAt: {
            type: Date,
            default: null
        },

        paymentMethod: {
            type: String,
            default: "UPI"
        },

        restaurantName: {
            type: String,
            default: ""
        },

        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("PaymentSession", paymentSessionSchema);
