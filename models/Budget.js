const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    month: { type: Date, required: true },
    description: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Budget", budgetSchema);
