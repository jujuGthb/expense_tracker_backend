const express = require("express");
const cors = require("cors"); //allows frontend apps to interact with the API
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse incoming JSON data in requests

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("API running...");
});

// Routes
app.use("/api/auth", require("./routes/auth")); //All routes starting with /api/auth are handled by the auth router

const transactionRoutes = require("./routes/transactions");
app.use("/api/transactions", transactionRoutes);

const budgetRoutes = require("./routes/budgets");
app.use("/api/budgets", budgetRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const profileRoutes = require("./routes/profile");
app.use("/api/profile", profileRoutes);

// Add this with other route imports
app.use("/api/reports", require("./routes/reports"));

module.exports = app;
