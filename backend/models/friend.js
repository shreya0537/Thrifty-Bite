const mongoose = require("mongoose");

const friendSchema = new mongoose.Schema(
    {
        requesterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        recipientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        status: {
            type: String,
            enum: ["PENDING", "ACCEPTED", "REJECTED"],
            default: "PENDING"
        }
    },
    {
        timestamps: true
    }
);

friendSchema.index(
    { requesterId: 1, recipientId: 1 },
    { unique: true }
);

module.exports = mongoose.model("Friend", friendSchema);
