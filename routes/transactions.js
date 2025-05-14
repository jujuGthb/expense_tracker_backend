const express = require("express");
const router = express.Router();
const {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  googleSpeechTotext,
} = require("../controllers/transactionController");
const auth = require("../middleware/authMiddleware");

const { audioUpload } = require("../middleware/multer-config");

router.post("/", auth, createTransaction);
router.post("/upload", audioUpload.single("audio"), googleSpeechTotext);

router.get("/", auth, getTransactions);
router.put("/:id", auth, updateTransaction);
router.delete("/:id", auth, deleteTransaction);

module.exports = router;
