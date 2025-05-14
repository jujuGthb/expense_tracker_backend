const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const fileUpload = require("../middleware/fileUpload");
const {
  getProfile,
  updateProfile,
} = require("../controllers/profileController");

router.get("/", auth, getProfile);
router.put("/", auth, fileUpload.single("profilePicture"), updateProfile);

module.exports = router;
