const mongoose = require("mongoose");

const shareSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        share: {
            type: Number,
            required: true,
            min: 0
        },

        paid: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    {
        _id: false
    }
);

const billSplitSchema = new mongoose.Schema(
    {
        groupOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "GroupOrder",
            required: true,
            unique: true
        },

        totalBill: {
            type: Number,
            required: true,
            min: 0
        },

        paidBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        splitType: {
            type: String,
            enum: ["EQUAL", "ITEM_WISE", "CUSTOM"],
            default: "EQUAL"
        },

        shares: {
            type: [shareSchema],
            default: []
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("BillSplit", billSplitSchema);
