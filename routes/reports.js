const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const authMiddleware = require("../middleware/authMiddleware");

// Apply auth middleware to all routes
router.use(authMiddleware);

// Generate a transaction report
router.post("/transactions", reportController.generateTransactionReport);

// Get all reports for the user
router.get("/", reportController.getUserReports);

module.exports = router;
