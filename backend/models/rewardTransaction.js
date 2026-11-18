const mongoose = require("mongoose");

const rewardTransactionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        points: {
            type: Number,
            required: true
        },

        reason: {
            type: String,
            required: true,
            trim: true
        },

        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },

        orderModel: {
            type: String,
            enum: ["Order", "CustomOrder", null],
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("RewardTransaction", rewardTransactionSchema);
