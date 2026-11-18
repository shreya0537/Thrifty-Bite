require("dotenv").config();

const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const User = require("./models/user");

/*
 * Usage:
 *   node seedAdmin.js admin@thriftybite.com admin123 "Admin User"
 *
 * Creates an ADMIN account if one with this email doesn't already exist.
 * Admin accounts cannot be created through /api/auth/register.
 */

const seedAdmin = async () => {
    try {
        const [, , email, password, name] = process.argv;

        if (!email || !password) {
            console.error("Usage: node seedAdmin.js <email> <password> [name]");
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB connected successfully.");

        const normalizedEmail = email.trim().toLowerCase();

        const existing = await User.findOne({ email: normalizedEmail });

        if (existing) {
            console.log(`A user with email ${normalizedEmail} already exists.`);
            await mongoose.connection.close();
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await User.create({
            username: `admin_${Date.now()}`,
            name: name || "Admin",
            email: normalizedEmail,
            password: hashedPassword,
            role: "ADMIN"
        });

        console.log(`Admin account created: ${admin.email}`);

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error("Admin seeding failed:", error.message);
        await mongoose.connection.close();
        process.exit(1);
    }
};

seedAdmin();
