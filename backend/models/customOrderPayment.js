const mongoose = require("mongoose");

const customOrderPaymentSchema = new mongoose.Schema(
    {
        customOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CustomOrder",
            required: true
        },

        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        amount: {
            type: Number,
            required: true,
            min: 0
        },

        paymentMethod: {
            type: String,
            enum: ["UPI", "Card", "Cash"],
            required: true
        },

        paymentStatus: {
            type: String,
            enum: ["PENDING", "PAID", "FAILED"],
            default: "PENDING"
        },

        paymentDate: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("CustomOrderPayment", customOrderPaymentSchema);
