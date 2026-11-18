const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const User = require("../models/user");
const ChefProfile = require("../models/chefProfile");

const router = express.Router();

const SELF_REGISTERABLE_ROLES = ["CUSTOMER", "RESTAURANT", "MASTER_CHEF"];

console.log("🔥 THRIFTY BITE AUTH ROUTES LOADED");
console.log(
    "🔥 AUTH ROUTES FILE:",
    require.resolve("./authRoutes")
);


/* =========================================================
   OTP STORAGE
========================================================= */

const otpStore = new Map();

const OTP_RESEND_COOLDOWN_MS = 60 * 1000;   // wait before another OTP can be sent
const OTP_MAX_ATTEMPTS = 5;                 // wrong OTP tries before it is discarded


/* =========================================================
   GMAIL TRANSPORTER
========================================================= */

const transporter = nodemailer.createTransport({

    service: "gmail",

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }

});


/* =========================================================
   TEST AUTH ROUTE
   GET /api/auth/test
========================================================= */

router.get("/test", (req, res) => {

    res.status(200).json({

        success: true,

        message:
            "Authentication route is working!"

    });

});


/* =========================================================
   FORGOT PASSWORD GET TEST
   GET /api/auth/forgot-password

   TEMPORARY TEST ROUTE
========================================================= */

router.get("/forgot-password", (req, res) => {

    res.status(200).json({

        success: true,

        message:
            "FORGOT PASSWORD ROUTE IS LOADED"

    });

});



/* =========================================================
   REGISTRATION EMAIL OTP
========================================================= */
const registrationOtpStore = new Map();
const REGISTRATION_OTP_TTL_MS = 10 * 60 * 1000;

function validEmailAddress(value) {
    return /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i.test(String(value || "").trim());
}

router.post("/send-registration-otp", async (req, res) => {
    try {
        const email = String(req.body.email || "").trim().toLowerCase();
        if (!validEmailAddress(email)) return res.status(400).json({ success: false, message: "Please enter a valid email address." });
        if (await User.findOne({ email })) return res.status(409).json({ success: false, message: "Email is already registered. Please log in." });

        const previous = registrationOtpStore.get(email);
        if (previous && previous.sentAt && Date.now() - previous.sentAt < OTP_RESEND_COOLDOWN_MS) {
            const waitSeconds = Math.ceil((OTP_RESEND_COOLDOWN_MS - (Date.now() - previous.sentAt)) / 1000);
            return res.status(429).json({ success: false, message: `Please wait ${waitSeconds} seconds before requesting another OTP.` });
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const expiresAt = Date.now() + REGISTRATION_OTP_TTL_MS;
        registrationOtpStore.set(email, { otp, expiresAt, sentAt: Date.now(), attempts: 0, verified: false });

        try {
            await transporter.sendMail({
                from: `"Thrifty Bite" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: "Thrifty Bite registration email verification",
                text: `Your Thrifty Bite email verification OTP is ${otp}. It expires in 10 minutes. Do not share this code.`,
                html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #d4af37;border-radius:14px"><h2 style="color:#4b0d1d">Thrifty Bite</h2><p>Use this six-digit code to verify your email address:</p><div style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#8f1d3c">${otp}</div><p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p></div>`
            });
        } catch (mailError) {
            registrationOtpStore.delete(email);
            console.error("Registration OTP email delivery failed:", mailError.message);
            return res.status(503).json({ success: false, message: "Could not send the verification email. Check EMAIL_USER and EMAIL_PASS (Gmail App Password) in backend/.env and try again." });
        }
        return res.status(200).json({ success: true, message: "A six-digit verification code has been sent to your email. It expires in 10 minutes." });
    } catch (error) {
        console.error("Send registration OTP error:", error);
        return res.status(500).json({ success: false, message: "Unable to send verification code right now." });
    }
});

router.post("/verify-registration-otp", async (req, res) => {
    try {
        const email = String(req.body.email || "").trim().toLowerCase();
        const otp = String(req.body.otp || "").trim();
        if (!validEmailAddress(email) || !/^\d{6}$/.test(otp)) {
            return res.status(400).json({ success: false, message: "Enter a valid email address and six-digit OTP." });
        }
        if (await User.findOne({ email })) {
            registrationOtpStore.delete(email);
            return res.status(409).json({ success: false, message: "Email is already registered. Please log in." });
        }
        const record = registrationOtpStore.get(email);
        if (!record) return res.status(400).json({ success: false, message: "Please request a new registration OTP." });
        if (Date.now() > record.expiresAt) {
            registrationOtpStore.delete(email);
            return res.status(400).json({ success: false, message: "OTP expired. Please request a new one." });
        }
        if (record.otp !== otp) {
            record.attempts += 1;
            if (record.attempts >= OTP_MAX_ATTEMPTS) registrationOtpStore.delete(email);
            else registrationOtpStore.set(email, record);
            return res.status(400).json({ success: false, message: record.attempts >= OTP_MAX_ATTEMPTS ? "Too many incorrect attempts. Request a new OTP." : `Incorrect OTP. ${OTP_MAX_ATTEMPTS - record.attempts} attempts remaining.` });
        }
        record.verified = true;
        record.verifiedAt = Date.now();
        registrationOtpStore.set(email, record);
        return res.json({ success: true, message: "Email Verified ✓" });
    } catch (error) {
        console.error("Verify registration OTP error:", error);
        return res.status(500).json({ success: false, message: "Unable to verify OTP right now." });
    }
});

/* =========================================================
   REGISTER
   POST /api/auth/register
========================================================= */

router.post("/register", async (req, res) => {

    try {

        const {
            email,
            password,
            name,
            mobile,
            address,
            role,
            ownerName,
            specialization,
            experience
        } = req.body;


        /* REQUIRED FIELDS */

        if (!email || !password) {

            return res.status(400).json({

                success: false,

                message:
                    "Email and password are required."

            });

        }


        const normalizedEmail = String(email || "").trim().toLowerCase();
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!emailPattern.test(normalizedEmail)) {
            return res.status(400).json({ success: false, message: "Please enter a valid email address." });
        }
        const registrationVerification = registrationOtpStore.get(normalizedEmail);
        if (!registrationVerification || !registrationVerification.verified ||
            Date.now() - (registrationVerification.verifiedAt || 0) > REGISTRATION_OTP_TTL_MS) {
            return res.status(403).json({ success: false, message: "Please verify your email with the six-digit OTP before registering." });
        }
        const passwordClasses = [/[A-Z]/.test(password), /[a-z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
        if (String(password).length < 8 || passwordClasses < 2) {
            return res.status(400).json({ success: false, message: "Choose a password of at least 8 characters using at least two types of characters." });
        }
        if (name && String(name).trim().length < 2) {
            return res.status(400).json({ success: false, message: "Please enter a valid name." });
        }
        if (!/^[6-9][0-9]{9}$/.test(String(mobile || "").replace(/\D/g, ""))) {
            return res.status(400).json({ success: false, message: "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9." });
        }

        /* VALIDATE ACCOUNT TYPE */

        const normalizedRole =
            (role || "CUSTOMER").toUpperCase();

        if (!SELF_REGISTERABLE_ROLES.includes(normalizedRole)) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid account type selected."

            });

        }


        if (normalizedRole === "RESTAURANT" && (!name || !ownerName)) {

            return res.status(400).json({

                success: false,

                message:
                    "Restaurant name and owner name are required."

            });

        }


        if (normalizedRole === "MASTER_CHEF" && !name) {

            return res.status(400).json({

                success: false,

                message:
                    "Chef name is required."

            });

        }


        /* NORMALIZE EMAIL */

        // Email normalized and validated above.


        /* CHECK EXISTING EMAIL */

        const existingEmail =
            await User.findOne({

                email: normalizedEmail

            });


        if (existingEmail) {

            return res.status(409).json({

                success: false,

                message:
                    "Email is already registered."

            });

        }

        const normalizedMobile = String(mobile || "").replace(/\D/g, "");
        const existingMobile = await User.findOne({ mobile: normalizedMobile });
        if (existingMobile) {
            return res.status(409).json({ success: false, message: "An account with this mobile number already exists." });
        }


        /* =================================================
           CREATE USERNAME FROM EMAIL
        ================================================= */

        let baseUsername =
            normalizedEmail
                .split("@")[0]
                .replace(/[^a-zA-Z0-9]/g, "");


        if (baseUsername.length < 3) {

            baseUsername = "user";

        }


        let username = baseUsername;

        let counter = 1;


        /* MAKE USERNAME UNIQUE */

        while (
            await User.findOne({
                username: username
            })
        ) {

            username =
                `${baseUsername}${counter}`;

            counter++;

        }


        /* HASH PASSWORD */

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );


        /* CREATE USER */

        const newUser = new User({

            username: username,

            email: normalizedEmail,

            emailVerified: true,

            password: hashedPassword,

            name: name || "",

            mobile: normalizedMobile,

            address: address || "",

            role: normalizedRole,

            ownerName:
                normalizedRole === "RESTAURANT"
                    ? ownerName
                    : ""

        });


        await newUser.save();
        registrationOtpStore.delete(normalizedEmail);


        /* CREATE CHEF PROFILE */

        if (normalizedRole === "MASTER_CHEF") {

            await ChefProfile.create({

                userId: newUser._id,

                specialization: specialization || "",

                experience: experience || ""

            });

        }


        console.log(
            `New user registered: ${normalizedEmail} (${normalizedRole})`
        );


        /* RESPONSE */

        res.status(201).json({

            success: true,

            message:
                "Account created successfully!",

            user: {

                username:
                    newUser.username,

                email:
                    newUser.email,

                role:
                    newUser.role

            }

        });

    }

    catch (error) {
        // A concurrent duplicate insert can bypass the earlier findOne check.
        if (error && error.code === 11000) {
            const duplicateField = Object.keys(error.keyPattern || {})[0];
            const message = duplicateField === "mobile"
                ? "An account with this mobile number already exists."
                : duplicateField === "email"
                    ? "Email is already registered."
                    : "This account already exists. Please log in.";

            return res.status(409).json({ success: false, message });
        }

        // A unique-index collision can happen if two registration requests arrive together.
        if (error && error.code === 11000) {
            const duplicateField = Object.keys(error.keyPattern || error.keyValue || {})[0];
            const message = duplicateField === "mobile"
                ? "An account with this mobile number already exists."
                : duplicateField === "username"
                    ? "Could not create a unique username. Please try again."
                    : "Email is already registered.";
            return res.status(409).json({ success: false, message });
        }
        console.error("Registration error:", error);
        return res.status(500).json({ success: false, message: "Server error during registration." });
    }

});


/* =========================================================
   LOGIN
   POST /api/auth/login
========================================================= */

router.post("/login", async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        /* REQUIRED FIELDS */

        if (!email || !password) {

            return res.status(400).json({

                success: false,

                message:
                    "Email and password are required."

            });

        }


        /* NORMALIZE EMAIL */

        const normalizedEmail =
            email.trim().toLowerCase();


        /* FIND USER */

        const user =
            await User.findOne({

                email: normalizedEmail

            });


        if (!user) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password."

            });

        }


        /* CHECK PASSWORD */

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!passwordMatch) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password."

            });

        }


        /* =================================================
           CREATE JWT
        ================================================= */

        const token =
            jwt.sign(

                {

                    userId:
                        user._id,

                    email:
                        user.email,

                    role:
                        user.role

                },

                process.env.JWT_SECRET,

                {

                    expiresIn: "7d"

                }

            );


        /* LOGIN SUCCESS */

        res.status(200).json({

            success: true,

            message:
                "Login successful!",

            token: token,

            user: {

                id:
                    user._id,

                username:
                    user.username,

                email:
                    user.email,

                name:
                    user.name,

                role:
                    user.role

            }

        });

    }

    catch (error) {

        console.error(
            "Login error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Server error during login."

        });

    }

});


/* =========================================================
   FORGOT PASSWORD
   POST /api/auth/forgot-password

   Generates a 6-digit OTP and sends it
   to the registered email.
========================================================= */

router.post("/forgot-password", async (req, res) => {

    try {

        const {
            email
        } = req.body;


        /* VALIDATE EMAIL */

        if (!email) {

            return res.status(400).json({

                success: false,

                message:
                    "Email is required."

            });

        }


        /* NORMALIZE EMAIL */

        const normalizedEmail =
            email.trim().toLowerCase();


        /* FIND USER */

        const user =
            await User.findOne({

                email: normalizedEmail

            });


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "No account found with this email."

            });

        }



        /* RESEND COOLDOWN */

        const previous = otpStore.get(normalizedEmail);

        if (previous && previous.sentAt && Date.now() - previous.sentAt < OTP_RESEND_COOLDOWN_MS) {

            const waitSeconds = Math.ceil(
                (OTP_RESEND_COOLDOWN_MS - (Date.now() - previous.sentAt)) / 1000
            );

            return res.status(429).json({
                success: false,
                retryAfter: waitSeconds,
                message: `Please wait ${waitSeconds} seconds before requesting a new OTP.`
            });

        }

        /* =================================================
           GENERATE 6-DIGIT OTP
        ================================================= */

        const otp =
            Math.floor(
                100000 +
                Math.random() * 900000
            ).toString();


        /* OTP VALID FOR 10 MINUTES */

        const expiresAt =
            Date.now() +
            (10 * 60 * 1000);


        /* STORE OTP */

        otpStore.set(

            normalizedEmail,

            {

                otp: otp,

                expiresAt:
                    expiresAt,

                verified:
                    false,

                attempts:
                    0,

                sentAt:
                    Date.now()

            }

        );


        /* =================================================
           EMAIL
        ================================================= */

        const mailOptions = {

            from:
                process.env.EMAIL_USER,

            to:
                normalizedEmail,

            subject:
                "Thrifty Bite | Password Reset OTP",

            html: `

                <div style="
                    margin:0;
                    padding:30px;
                    background:#260611;
                    font-family:Arial,sans-serif;
                    color:#fff8e8;
                ">

                    <div style="
                        max-width:550px;
                        margin:auto;
                        padding:35px;
                        background:#4b0d1d;
                        border:1px solid #d4af37;
                        border-radius:18px;
                        text-align:center;
                    ">

                        <h1 style="
                            margin:0;
                            color:#f7df7a;
                            letter-spacing:4px;
                        ">
                            THRIFTY BITE
                        </h1>


                        <p style="
                            color:#d4af37;
                            letter-spacing:2px;
                            font-size:13px;
                        ">
                            ROYAL TASTE • SMART CHOICE
                        </p>


                        <hr style="
                            border:0;
                            border-top:1px solid #d4af37;
                            margin:25px 0;
                        ">


                        <h2 style="
                            color:#fff8e8;
                        ">
                            Password Reset
                        </h2>


                        <p style="
                            color:#d6c7c0;
                            line-height:1.6;
                        ">
                            We received a request to reset
                            your Thrifty Bite password.
                        </p>


                        <p style="
                            color:#d6c7c0;
                        ">
                            Your verification OTP is:
                        </p>


                        <div style="
                            background:#19040c;
                            padding:20px;
                            margin:25px 0;
                            border-radius:12px;
                            border:1px solid #8f6d1c;
                        ">

                            <span style="
                                color:#f7df7a;
                                font-size:36px;
                                font-weight:bold;
                                letter-spacing:10px;
                            ">
                                ${otp}
                            </span>

                        </div>


                        <p style="
                            color:#cdbfa9;
                            font-size:14px;
                        ">
                            This OTP is valid for
                            <strong>10 minutes</strong>.
                        </p>


                        <p style="
                            color:#8f7c72;
                            font-size:12px;
                            margin-top:25px;
                        ">
                            If you did not request this
                            password reset, please ignore
                            this email.
                        </p>

                    </div>

                </div>

            `

        };


        /* SEND EMAIL */

        try {

            await transporter.sendMail(
                mailOptions
            );

        } catch (mailError) {

            console.error("Password reset email failed:", mailError.response || mailError.message);

            /* Development fallback: if Gmail isn't set up yet (e.g. no
               App Password), print the OTP in the server console so the
               reset flow can still be tested. Never done in production. */
            if (process.env.NODE_ENV !== "production") {

                console.log("==================================================");
                console.log(` DEV MODE — password reset OTP for ${normalizedEmail}: ${otp}`);
                console.log("==================================================");

                return res.status(200).json({
                    success: true,
                    devMode: true,
                    message: "Email could not be sent (Gmail App Password not set up). Development mode: the OTP is shown in the server console."
                });

            }

            otpStore.delete(normalizedEmail);

            return res.status(500).json({
                success: false,
                message: "Unable to send the OTP email right now. Please try again later."
            });

        }


        console.log(
            `Password reset OTP sent to ${normalizedEmail}`
        );


        /* SUCCESS */

        res.status(200).json({

            success: true,

            message:
                "OTP sent successfully to your registered email."

        });

    }

    catch (error) {

        console.error(
            "Forgot password error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Unable to send OTP. Please check your email configuration."

        });

    }

});


/* =========================================================
   VERIFY OTP
   POST /api/auth/verify-otp
========================================================= */

router.post("/verify-otp", async (req, res) => {

    try {

        const {
            email,
            otp
        } = req.body;


        /* VALIDATION */

        if (!email || !otp) {

            return res.status(400).json({

                success: false,

                message:
                    "Email and OTP are required."

            });

        }


        const normalizedEmail =
            email.trim().toLowerCase();


        /* GET STORED OTP */

        const storedData =
            otpStore.get(
                normalizedEmail
            );


        if (!storedData) {

            return res.status(400).json({

                success: false,

                message:
                    "OTP not found. Please request a new OTP."

            });

        }


        /* CHECK EXPIRY */

        if (
            Date.now() >
            storedData.expiresAt
        ) {

            otpStore.delete(
                normalizedEmail
            );


            return res.status(400).json({

                success: false,

                message:
                    "OTP has expired. Please request a new OTP."

            });

        }


        /* CHECK OTP */

        if (
            storedData.otp !==
            otp.toString().trim()
        ) {

            storedData.attempts = (storedData.attempts || 0) + 1;

            if (storedData.attempts >= OTP_MAX_ATTEMPTS) {

                otpStore.delete(normalizedEmail);

                return res.status(400).json({
                    success: false,
                    message: "Too many wrong attempts. Please request a new OTP."
                });

            }

            const triesLeft = OTP_MAX_ATTEMPTS - storedData.attempts;


            return res.status(400).json({

                success: false,

                message:
                    `Invalid OTP. ${triesLeft} ${triesLeft === 1 ? "try" : "tries"} left.`

            });

        }


        /* MARK VERIFIED */

        storedData.verified = true;


        otpStore.set(

            normalizedEmail,

            storedData

        );


        console.log(
            `OTP verified for ${normalizedEmail}`
        );


        res.status(200).json({

            success: true,

            message:
                "OTP verified successfully."

        });

    }

    catch (error) {

        console.error(
            "OTP verification error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Server error during OTP verification."

        });

    }

});


/* =========================================================
   RESET PASSWORD
   POST /api/auth/reset-password
========================================================= */

router.post("/reset-password", async (req, res) => {

    try {

        const {
            email,
            newPassword
        } = req.body;


        /* REQUIRED FIELDS */

        if (!email || !newPassword) {

            return res.status(400).json({

                success: false,

                message:
                    "Email and new password are required."

            });

        }


        /* PASSWORD LENGTH */

        if (newPassword.length < 8) {

            return res.status(400).json({

                success: false,

                message:
                    "Password must contain at least 8 characters."

            });

        }


        const normalizedEmail =
            email.trim().toLowerCase();


        /* GET OTP DATA */

        const storedData =
            otpStore.get(
                normalizedEmail
            );


        /* OTP MUST BE VERIFIED */

        if (
            !storedData ||
            storedData.verified !== true
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Please verify the OTP before resetting your password."

            });

        }


        /* CHECK OTP EXPIRY */

        if (
            Date.now() >
            storedData.expiresAt
        ) {

            otpStore.delete(
                normalizedEmail
            );


            return res.status(403).json({

                success: false,

                message:
                    "OTP verification has expired. Please request a new OTP."

            });

        }


        /* FIND USER */

        const user =
            await User.findOne({

                email: normalizedEmail

            });


        if (!user) {

            otpStore.delete(
                normalizedEmail
            );


            return res.status(404).json({

                success: false,

                message:
                    "User account not found."

            });

        }


        /* HASH NEW PASSWORD */

        const hashedPassword =
            await bcrypt.hash(
                newPassword,
                10
            );


        /* UPDATE PASSWORD */

        user.password =
            hashedPassword;


        await user.save();


        /* DELETE USED OTP */

        otpStore.delete(
            normalizedEmail
        );


        console.log(
            `Password reset successful for ${normalizedEmail}`
        );


        /* SUCCESS */

        res.status(200).json({

            success: true,

            message:
                "Password reset successfully. You can now login with your new password."

        });

    }

    catch (error) {

        console.error(
            "Reset password error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Server error while resetting password."

        });

    }

});


/* =========================================================
   EXPORT
========================================================= */

module.exports = router;