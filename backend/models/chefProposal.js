const mongoose = require("mongoose");

const chefProposalSchema = new mongoose.Schema(
    {
        customOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CustomOrder",
            required: true
        },

        chefId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        amount: {
            type: Number,
            required: true,
            min: 0
        },

        preparationTime: {
            type: String,
            required: true,
            trim: true
        },

        chefNotes: {
            type: String,
            trim: true,
            default: ""
        },

        proposalStatus: {
            type: String,
            enum: ["SENT", "ACCEPTED", "REJECTED"],
            default: "SENT"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("ChefProposal", chefProposalSchema);
