const multer = require("multer");
const path = require("path");

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("audio/")) {
    cb(null, true);
  } else {
    cb(new Error("Seuls les fichiers audio sont autorisés !"), false);
  }
};

const audioUpload = multer({ storage: multer.memoryStorage(), fileFilter });
module.exports = { audioUpload };
