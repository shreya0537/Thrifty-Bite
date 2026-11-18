const express = require("express");

const Cart = require("../models/cart");
const Menu = require("../models/menu");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


/* =========================================================
   GET CART
   GET /api/cart
========================================================= */

router.get("/", authMiddleware, async (req, res) => {

    try {

        let cart = await Cart.findOne({
            userId: req.user.userId
        });

        /*
         * If the user does not have a cart yet,
         * create an empty cart.
         */

        if (!cart) {

            cart = await Cart.create({
                userId: req.user.userId,
                items: []
            });

        }


        res.status(200).json({

            success: true,

            cart: cart

        });


    } catch (error) {

        console.error("Get cart error:", error);

        res.status(500).json({

            success: false,

            message: "Server error while fetching cart."

        });

    }

});


/* =========================================================
   ADD ITEM TO CART
   POST /api/cart
========================================================= */

router.post("/", authMiddleware, async (req, res) => {

    try {

        const {
            menuItemId,
            quantity
        } = req.body;


        if (!menuItemId) {

            return res.status(400).json({

                success: false,

                message: "Menu item ID is required."

            });

        }


        const requestedQuantity =
            Number(quantity || 1);


        if (
            !Number.isInteger(requestedQuantity) ||
            requestedQuantity < 1
        ) {

            return res.status(400).json({

                success: false,

                message: "Quantity must be at least 1."

            });

        }


        /*
         * Get the actual menu item from MongoDB.
         */

        const menuItem =
            await Menu.findById(menuItemId);


        if (!menuItem) {

            return res.status(404).json({

                success: false,

                message: "Menu item not found."

            });

        }


        if (!menuItem.isAvailable) {

            return res.status(400).json({

                success: false,

                message: "This menu item is currently unavailable."

            });

        }


        /*
         * Find user's cart.
         */

        let cart =
            await Cart.findOne({
                userId: req.user.userId
            });


        /*
         * Create cart if it doesn't exist.
         */

        if (!cart) {

            cart = new Cart({

                userId: req.user.userId,

                items: []

            });

        }


        /*
         * Check whether item already exists.
         */

        const existingItem =
            cart.items.find(
                item =>
                    item.menuItemId.toString() ===
                    menuItemId.toString()
            );


        if (existingItem) {

            existingItem.quantity +=
                requestedQuantity;

        } else {

            cart.items.push({

                menuItemId: menuItem._id,

                restaurantId: menuItem.restaurantId,

                name: menuItem.name,

                image: menuItem.image,

                category: menuItem.category,

                price: menuItem.price,

                discountPrice:
                    menuItem.discountPrice,

                quantity:
                    requestedQuantity

            });

        }


        await cart.save();


        res.status(200).json({

            success: true,

            message: "Item added to cart successfully!",

            cart: cart

        });


    } catch (error) {

        console.error("Add to cart error:", error);

        res.status(500).json({

            success: false,

            message: "Server error while adding item to cart."

        });

    }

});


/* =========================================================
   UPDATE ITEM QUANTITY
   PUT /api/cart/:menuItemId
========================================================= */

router.put(
    "/:menuItemId",
    authMiddleware,
    async (req, res) => {

        try {

            const {
                quantity
            } = req.body;


            const newQuantity =
                Number(quantity);


            if (
                !Number.isInteger(newQuantity) ||
                newQuantity < 1
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Quantity must be at least 1."

                });

            }


            const cart =
                await Cart.findOne({
                    userId: req.user.userId
                });


            if (!cart) {

                return res.status(404).json({

                    success: false,

                    message: "Cart not found."

                });

            }


            const item =
                cart.items.find(
                    item =>
                        item.menuItemId.toString() ===
                        req.params.menuItemId.toString()
                );


            if (!item) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Item not found in cart."

                });

            }


            item.quantity =
                newQuantity;


            await cart.save();


            res.status(200).json({

                success: true,

                message:
                    "Cart quantity updated successfully!",

                cart: cart

            });


        } catch (error) {

            console.error(
                "Update cart error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Server error while updating cart."

            });

        }

    }
);


/* =========================================================
   REMOVE ITEM FROM CART
   DELETE /api/cart/:menuItemId
========================================================= */

router.delete(
    "/:menuItemId",
    authMiddleware,
    async (req, res) => {

        try {

            const cart =
                await Cart.findOne({
                    userId: req.user.userId
                });


            if (!cart) {

                return res.status(404).json({

                    success: false,

                    message: "Cart not found."

                });

            }


            const originalLength =
                cart.items.length;


            cart.items =
                cart.items.filter(
                    item =>
                        item.menuItemId.toString() !==
                        req.params.menuItemId.toString()
                );


            if (
                cart.items.length ===
                originalLength
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Item not found in cart."

                });

            }


            await cart.save();


            res.status(200).json({

                success: true,

                message:
                    "Item removed from cart successfully!",

                cart: cart

            });


        } catch (error) {

            console.error(
                "Remove cart item error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Server error while removing item."

            });

        }

    }
);


/* =========================================================
   CLEAR CART
   DELETE /api/cart
========================================================= */

router.delete(
    "/",
    authMiddleware,
    async (req, res) => {

        try {

            const cart =
                await Cart.findOne({
                    userId: req.user.userId
                });


            if (!cart) {

                return res.status(404).json({

                    success: false,

                    message: "Cart not found."

                });

            }


            cart.items = [];


            await cart.save();


            res.status(200).json({

                success: true,

                message: "Cart cleared successfully!",

                cart: cart

            });


        } catch (error) {

            console.error(
                "Clear cart error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Server error while clearing cart."

            });

        }

    }
);


console.log("CART ROUTES LOADED");


module.exports = router;
