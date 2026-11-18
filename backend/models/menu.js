const mongoose = require("mongoose");

/* =========================================================
   MENU ITEM SCHEMA
========================================================= */

const menuSchema = new mongoose.Schema(
    {
        /* =========================
           OWNERSHIP
        ========================= */

        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        /* =========================
           BASIC FOOD INFORMATION
        ========================= */

        name: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        category: {
            type: String,
            required: true,
            trim: true
        },

        /* =========================
           IMAGE
        ========================= */

        image: {
            type: String,
            default: ""
        },

        /* =========================
           PRICE INFORMATION
        ========================= */

        price: {
            type: Number,
            required: true,
            min: 0
        },

        discountPrice: {
            type: Number,
            required: true,
            min: 0
        },

        /* =========================
           RATINGS
        ========================= */

        rating: {
            type: Number,
            default: 4.5,
            min: 0,
            max: 5
        },

        reviewCount: {
            type: Number,
            default: 0,
            min: 0
        },

        /* =========================
           FOOD TYPE
        ========================= */

        isVeg: {
            type: Boolean,
            default: true
        },

        /* =========================
           AVAILABILITY
        ========================= */

        isAvailable: {
            type: Boolean,
            default: true
        },

        /* =========================
           SEARCH / AI TAGS
        ========================= */

        tags: {
            type: [String],
            default: []
        }
    },

    /* =========================
       AUTOMATIC TIMESTAMPS
    ========================= */

    {
        timestamps: true
    }
);


/* =========================================================
   EXPORT MENU MODEL
========================================================= */

module.exports =
    mongoose.models.Menu ||
    mongoose.model("Menu", menuSchema);