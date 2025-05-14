const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: String,
    email: { type: String, unique: true },
    currency: { type: String, default: "USD" },
    monthlyBudgetGoal: Number,
    profilePicture: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Profile", profileSchema);
