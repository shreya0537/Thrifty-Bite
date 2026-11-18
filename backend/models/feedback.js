const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  username: { type: String, default: "Guest", trim: true, maxlength: 80 },
  rating: { type: Number, required: true, min: 1, max: 5 },
  category: { type: String, enum: ["Overall experience", "Food and menu", "Website design", "Voice ordering", "Dine Out", "Other"], default: "Overall experience" },
  message: { type: String, required: true, trim: true, minlength: 3, maxlength: 2000 },
  page: { type: String, default: "website", maxlength: 120 }
}, { timestamps: true });

module.exports = mongoose.models.Feedback || mongoose.model("Feedback", feedbackSchema);
