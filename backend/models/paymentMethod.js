const mongoose = require("mongoose");

/*
 * Mock payment methods only — this project has no real payment
 * gateway. We never store full card numbers or CVVs, only a
 * label and the last 4 digits (for cards) or a UPI ID.
 */

const paymentMethodSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        type: {
            type: String,
            enum: ["UPI", "Card"],
            required: true
        },

        label: {
            type: String,
            required: true,
            trim: true
        },

        /* UPI id, or card last-4 digits — never a full card number */
        detail: {
            type: String,
            required: true,
            trim: true
        },

        isDefault: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("PaymentMethod", paymentMethodSchema);
