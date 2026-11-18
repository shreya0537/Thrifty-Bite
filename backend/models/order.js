const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
    {
        menuItemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Menu",
            required: true
        },

        name: {
            type: String,
            required: true
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        quantity: {
            type: Number,
            required: true,
            min: 1
        }
    },
    {
        _id: false
    }
);

const orderSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        items: {
            type: [orderItemSchema],
            default: []
        },

        // Item total before any coupon discount
        subtotal: {
            type: Number,
            default: 0,
            min: 0
        },

        couponCode: {
            type: String,
            default: null
        },

        discountAmount: {
            type: Number,
            default: 0,
            min: 0
        },

        // Amount payable (subtotal - discountAmount)
        totalAmount: {
            type: Number,
            default: 0,
            min: 0
        },

        deliveryAddress: {
            fullName: String,
            phone: String,
            houseAddress: String,
            area: String,
            city: String,
            state: String,
            pincode: String
        },

        deliveryLocation: {
            latitude: { type: Number, min: -90, max: 90 },
            longitude: { type: Number, min: -180, max: 180 }
        },

        groupOrder: {
            isGroupOrder: { type: Boolean, default: false },
            splitMethod: { type: String, enum: ["equal", "item"], default: null },
            totalAmount: { type: Number, min: 0, default: null }
        },

        paymentMethod: {
            type: String,
            enum: ["UPI", "Card", "Cash"],
            default: "Cash"
        },

        // PAID = verified Razorpay payment, COD = pay on delivery
        paymentStatus: {
            type: String,
            enum: ["COD", "PAID"],
            default: "COD"
        },

        razorpayOrderId: {
            type: String,
            default: null
        },

        razorpayPaymentId: {
            type: String,
            default: null
        },

        status: {
            type: String,
            enum: [
                "PLACED",
                "ACCEPTED",
                "REJECTED",
                "PREPARING",
                "PACKED",
                "READY",
                "SHIPPED",
                "OUT_FOR_DELIVERY",
                "DELIVERED",
                "COMPLETED"
            ],
            default: "PLACED"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Order", orderSchema);
