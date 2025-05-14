const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
} = require("../controllers/budgetController");

router.post("/", auth, createBudget);
router.get("/", auth, getBudgets);
router.put("/:id", auth, updateBudget);
router.delete("/:id", auth, deleteBudget);

module.exports = router;
