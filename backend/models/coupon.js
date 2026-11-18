const mongoose = require("mongoose");

/* =========================================================
   COUPON
   PERCENT coupons take discountValue% off the subtotal
   (capped at maxDiscount if set); FLAT coupons take a fixed
   rupee amount off. firstOrderOnly coupons only work for a
   customer who has never placed an order before.
========================================================= */

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },

        title: {
            type: String,
            trim: true,
            default: ""
        },

        description: {
            type: String,
            trim: true,
            default: ""
        },

        discountType: {
            type: String,
            enum: ["PERCENT", "FLAT"],
            required: true
        },

        discountValue: {
            type: Number,
            required: true,
            min: 0
        },

        maxDiscount: {
            type: Number,
            default: null,
            min: 0
        },

        minOrderAmount: {
            type: Number,
            default: 0,
            min: 0
        },

        firstOrderOnly: {
            type: Boolean,
            default: false
        },

        perUserLimit: {
            type: Number,
            default: 1,
            min: 1
        },

        validUntil: {
            type: Date,
            default: null
        },

        active: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Coupon", couponSchema);
