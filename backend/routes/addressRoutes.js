const express = require("express");
const Address = require("../models/address");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/* ================================
   GET ALL ADDRESSES
================================ */

router.get("/", authMiddleware, async (req, res) => {
    try {
        const addresses = await Address.find({
            userId: req.user.userId
        }).sort({
            isDefault: -1,
            createdAt: -1
        });

        res.status(200).json({
            success: true,
            addresses: addresses
        });

    } catch (error) {
        console.error("Get addresses error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching addresses."
        });
    }
});


/* ================================
   ADD NEW ADDRESS
================================ */

router.post("/", authMiddleware, async (req, res) => {
    try {
        const {
            fullName,
            phone,
            houseAddress,
            area,
            city,
            state,
            pincode,
            addressType,
            isDefault
        } = req.body;

        if (
            !fullName ||
            !phone ||
            !houseAddress ||
            !area ||
            !city ||
            !state ||
            !pincode
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required address fields."
            });
        }

        /* If this address is default,
           remove default status from old addresses */

        if (isDefault) {
            await Address.updateMany(
                {
                    userId: req.user.userId
                },
                {
                    $set: {
                        isDefault: false
                    }
                }
            );
        }

        const newAddress = new Address({
            userId: req.user.userId,
            fullName,
            phone,
            houseAddress,
            area,
            city,
            state,
            pincode,
            addressType: addressType || "Home",
            isDefault: Boolean(isDefault)
        });

        await newAddress.save();

        res.status(201).json({
            success: true,
            message: "Address added successfully!",
            address: newAddress
        });

    } catch (error) {
        console.error("Add address error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while adding address."
        });
    }
});


/* ================================
   UPDATE ADDRESS
================================ */

router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const {
            fullName,
            phone,
            houseAddress,
            area,
            city,
            state,
            pincode,
            addressType,
            isDefault
        } = req.body;

        const address = await Address.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: "Address not found."
            });
        }

        if (isDefault) {
            await Address.updateMany(
                {
                    userId: req.user.userId,
                    _id: { $ne: req.params.id }
                },
                {
                    $set: {
                        isDefault: false
                    }
                }
            );
        }

        address.fullName = fullName;
        address.phone = phone;
        address.houseAddress = houseAddress;
        address.area = area;
        address.city = city;
        address.state = state;
        address.pincode = pincode;
        address.addressType = addressType || "Home";
        address.isDefault = Boolean(isDefault);

        await address.save();

        res.status(200).json({
            success: true,
            message: "Address updated successfully!",
            address: address
        });

    } catch (error) {
        console.error("Update address error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while updating address."
        });
    }
});


/* ================================
   DELETE ADDRESS
================================ */

router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const address = await Address.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: "Address not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Address deleted successfully!"
        });

    } catch (error) {
        console.error("Delete address error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while deleting address."
        });
    }
});


console.log("ADDRESS ROUTES LOADED");
module.exports = router;