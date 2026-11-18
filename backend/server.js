require("dotenv").config();

const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const occasionPlanRoutes = require("./routes/occasionPlanRoutes");
const dineoutRoutes = require("./routes/dineoutRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");

console.log(
    "🔥 AUTH ROUTES FILE:",
    require.resolve("./routes/authRoutes")
);

const profileRoutes = require("./routes/profileRoutes");
const addressRoutes = require("./routes/addressRoutes");
const menuRoutes = require("./routes/menuRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const restaurantRoutes = require("./routes/restaurantRoutes");
const chefRoutes = require("./routes/chefRoutes");
const customOrderRoutes = require("./routes/customOrderRoutes");
const friendRoutes = require("./routes/friendRoutes");
const groupOrderRoutes = require("./routes/groupOrderRoutes");
const billSplitRoutes = require("./routes/billSplitRoutes");
const adminRoutes = require("./routes/adminRoutes");
const favouriteRoutes = require("./routes/favouriteRoutes");
const rewardRoutes = require("./routes/rewardRoutes");
const paymentMethodRoutes = require("./routes/paymentMethodRoutes");
const couponRoutes = require("./routes/couponRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const { seedDefaultCoupons } = require("./utils/coupons");

const app = express();

app.use(cors());
app.use(express.json());

// Serve frontend files
const FRONTEND_DIR = path.join(__dirname, "..", "frontend");
app.use(express.static(FRONTEND_DIR));

// Serve uploaded files (avatars, etc.)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Home page
app.get("/", (req, res) => {
    res.sendFile(
        path.join(FRONTEND_DIR, "login.html")
    );
});

// API test
app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "Thrifty Bite API is working"
    });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/occasion-plans", occasionPlanRoutes);
app.use("/api/dineout", dineoutRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/restaurant", restaurantRoutes);
app.use("/api/chef", chefRoutes);
app.use("/api/custom-orders", customOrderRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/group-orders", groupOrderRoutes);
app.use("/api/bill-split", billSplitRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/favourites", favouriteRoutes);
app.use("/api/rewards", rewardRoutes);
app.use("/api/payment-methods", paymentMethodRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payment", paymentRoutes);

const PORT = process.env.PORT || 5500;

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {

        console.log("MongoDB connected successfully");

        seedDefaultCoupons().catch((err) =>
            console.error("Seed default coupons error:", err)
        );

        app.listen(PORT, () => {

            console.log(
                `Thrifty Bite server running at http://localhost:${PORT}`
            );

        });

    })
    .catch((error) => {

        console.error("MongoDB connection failed:");
        console.error(error.message);

    });