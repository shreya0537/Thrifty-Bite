const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3
        },

        name: {
            type: String,
            trim: true,
            default: ""
        },

        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },

        emailVerified: {
            type: Boolean,
            default: true
        },

        mobile: {
            type: String,
            trim: true,
            default: ""
        },

        password: {
            type: String,
            required: true
        },

        address: {
            type: String,
            trim: true,
            default: ""
        },

        role: {
            type: String,
            enum: ["CUSTOMER", "RESTAURANT", "MASTER_CHEF", "ADMIN"],
            default: "CUSTOMER"
        },

        /* Only used when role === "RESTAURANT" */
        ownerName: {
            type: String,
            trim: true,
            default: ""
        },

        isActive: {
            type: Boolean,
            default: true
        },

        avatar: {
            type: String,
            trim: true,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);
