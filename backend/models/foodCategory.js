const mongoose = require("mongoose");

const foodCategorySchema = new mongoose.Schema(
    {
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

foodCategorySchema.index(
    { restaurantId: 1, name: 1 },
    { unique: true }
);

module.exports = mongoose.model("FoodCategory", foodCategorySchema);
