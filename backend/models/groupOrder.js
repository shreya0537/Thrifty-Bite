const mongoose = require("mongoose");
const crypto = require("crypto");

const groupOrderItemSchema = new mongoose.Schema(
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
            min: 1,
            default: 1
        },

        /* Which member this item is for — null means shared/unassigned
           (split equally among all members during an item-wise bill split) */
        memberId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    {
        _id: false
    }
);

const groupOrderSchema = new mongoose.Schema(
    {
        // Keep legacy Atlas unique groupCode indexes safe for new documents.
        groupCode: {
            type: String,
            unique: true,
            index: true,
            default: () => "GB-" + crypto.randomBytes(6).toString("hex").toUpperCase()
        },

        creatorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        /* Normal group food order */
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        items: {
            type: [groupOrderItemSchema],
            default: []
        },

        /* Custom chef group order */
        customOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CustomOrder",
            default: null
        },

        totalAmount: {
            type: Number,
            default: 0,
            min: 0
        },

        status: {
            type: String,
            enum: [
                "PLACED",
                "ACCEPTED",
                "PREPARING",
                "READY",
                "OUT_FOR_DELIVERY",
                "DELIVERED",
                "COMPLETED",
                "CANCELLED"
            ],
            default: "PLACED"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("GroupOrder", groupOrderSchema);
