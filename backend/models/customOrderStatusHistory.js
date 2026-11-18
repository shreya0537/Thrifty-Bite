const mongoose = require("mongoose");

const customOrderStatusHistorySchema = new mongoose.Schema(
    {
        customOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CustomOrder",
            required: true
        },

        status: {
            type: String,
            required: true
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        remarks: {
            type: String,
            trim: true,
            default: ""
        },

        updatedAt: {
            type: Date,
            default: Date.now
        }
    }
);

module.exports = mongoose.model(
    "CustomOrderStatusHistory",
    customOrderStatusHistorySchema
);
