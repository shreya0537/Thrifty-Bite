const express = require("express");
const Feedback = require("../models/feedback");
const router = express.Router();

// Public feedback submission: accepts signed-in users and guests.
router.post("/", async (req, res) => {
  try {
    const { username, rating, category, message, page } = req.body || {};
    const score = Number(rating);
    const cleanMessage = String(message || "").trim();
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return res.status(400).json({ success: false, message: "Please choose a rating from 1 to 5 stars." });
    }
    if (cleanMessage.length < 3 || cleanMessage.length > 2000) {
      return res.status(400).json({ success: false, message: "Feedback must contain 3 to 2000 characters." });
    }
    const allowed = ["Overall experience", "Food and menu", "Website design", "Voice ordering", "Dine Out", "Other"];
    const feedback = await Feedback.create({
      username: String(username || "Guest").trim().slice(0, 80) || "Guest",
      rating: score, category: allowed.includes(category) ? category : "Overall experience",
      message: cleanMessage, page: String(page || "website").slice(0, 120)
    });
    return res.status(201).json({ success: true, message: "Thank you! Your rating and feedback have been saved.", id: feedback._id });
  } catch (error) {
    console.error("Feedback submission failed:", error);
    return res.status(500).json({ success: false, message: "Could not save feedback right now. Please try again." });
  }
});

module.exports = router;
