const mongoose = require("mongoose");

const favouriteSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        menuItemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Menu",
            required: true
        }
    },
    {
        timestamps: true
    }
);

favouriteSchema.index(
    { userId: 1, menuItemId: 1 },
    { unique: true }
);

module.exports = mongoose.model("Favourite", favouriteSchema);
