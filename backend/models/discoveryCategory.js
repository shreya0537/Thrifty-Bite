const mongoose = require("mongoose");

/* =========================================================
   DISCOVERY CATEGORY
   Global, admin/seed-managed taxonomy for the food-first
   home page carousel (PDF §19.1/§19.4 "food_categories").
   Distinct from FoodCategory, which is a per-restaurant
   menu-management category.
========================================================= */

const discoveryCategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },

        image: {
            type: String,
            default: ""
        },

        description: {
            type: String,
            default: ""
        },

        displayOrder: {
            type: Number,
            default: 0
        },

        active: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("DiscoveryCategory", discoveryCategorySchema);
