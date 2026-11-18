const mongoose = require("mongoose");

/* =========================================================
   EXTERNAL FOOD PRICE
   Reference/sample price-comparison rows (PDF §19.5/§19.6).
   platform: OUR_APP rows are rarely stored (Our App price is
   computed live from the Menu item itself) — this table exists
   mainly to hold SWIGGY / ZOMATO reference rows an admin enters.
   sourceType is SAMPLE/MANUAL/API per the PDF; this project only
   ever writes SAMPLE or MANUAL rows (no live scraping/API use).
========================================================= */

const PLATFORMS = ["OUR_APP", "SWIGGY", "ZOMATO"];
const SOURCE_TYPES = ["SAMPLE", "MANUAL", "API"];

const externalFoodPriceSchema = new mongoose.Schema(
    {
        menuItemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Menu",
            required: true
        },

        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        platform: {
            type: String,
            enum: PLATFORMS,
            required: true
        },

        externalRestaurantName: {
            type: String,
            trim: true,
            default: ""
        },

        externalFoodName: {
            type: String,
            trim: true,
            default: ""
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        discountPrice: {
            type: Number,
            default: null,
            min: 0
        },

        deliveryFee: {
            type: Number,
            default: 0,
            min: 0
        },

        packagingFee: {
            type: Number,
            default: 0,
            min: 0
        },

        tax: {
            type: Number,
            default: 0,
            min: 0
        },

        totalPrice: {
            type: Number,
            default: 0,
            min: 0
        },

        availability: {
            type: Boolean,
            default: true
        },

        sourceType: {
            type: String,
            enum: SOURCE_TYPES,
            default: "SAMPLE"
        },

        lastUpdated: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

/* One row per (menu item, platform) — editing re-uses the row
   instead of accumulating duplicates. */
externalFoodPriceSchema.index(
    { menuItemId: 1, platform: 1 },
    { unique: true }
);

externalFoodPriceSchema.pre("save", function () {
    const effectivePrice = this.discountPrice != null ? this.discountPrice : this.price;
    this.totalPrice =
        Math.round((effectivePrice + this.deliveryFee + this.packagingFee + this.tax) * 100) / 100;
});

externalFoodPriceSchema.statics.PLATFORMS = PLATFORMS;
externalFoodPriceSchema.statics.SOURCE_TYPES = SOURCE_TYPES;

module.exports = mongoose.model("ExternalFoodPrice", externalFoodPriceSchema);
