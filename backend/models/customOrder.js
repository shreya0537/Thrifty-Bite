const mongoose = require("mongoose");

const CUSTOM_ORDER_STATUSES = [
    "REQUESTED",
    "CHEF_ACCEPTED",
    "CHEF_PROPOSED",
    "CONFIRMED",
    "PREPARING",
    "READY",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "COMPLETED",
    "REJECTED",
    "CANCELLED"
];

const customOrderSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        /* Null until a chef accepts an open (broadcast) request */
        chefId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        foodRequired: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        quantity: {
            type: Number,
            default: 1,
            min: 1
        },

        preferredDate: {
            type: Date,
            required: true
        },

        preferredTime: {
            type: String,
            required: true,
            trim: true
        },

        specialInstructions: {
            type: String,
            trim: true,
            default: ""
        },

        referenceImage: {
            type: String,
            default: ""
        },

        status: {
            type: String,
            enum: CUSTOM_ORDER_STATUSES,
            default: "REQUESTED"
        },

        /* Set when this request was created as part of a group order */
        groupOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "GroupOrder",
            default: null
        }
    },
    {
        timestamps: true
    }
);

customOrderSchema.statics.STATUSES = CUSTOM_ORDER_STATUSES;

module.exports = mongoose.model("CustomOrder", customOrderSchema);
