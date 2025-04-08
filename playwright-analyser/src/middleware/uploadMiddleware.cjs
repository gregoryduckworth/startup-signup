// src/middleware/uploadMiddleware.cjs
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const config = require("../config.cjs"); // Use shared config for UPLOAD_DIR

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    fs.access(config.uploadDir, fs.constants.W_OK, (err) => {
      if (err) {
        console.error(
          `Multer Dest Check Error: No write perm for ${config.uploadDir}`,
          err
        );
        return cb(err);
      }
      cb(null, config.uploadDir);
    });
  },
  filename: function (req, file, cb) {
    const uniquePrefix = Date.now() + "-" + Math.round(Math.random() * 1e6);
    const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, uniquePrefix + "-" + safeOriginalName);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit per file
}).fields([
  // Keep same field definitions
  { name: "trace", maxCount: 1 },
  { name: "video", maxCount: 1 },
  { name: "sourceCode", maxCount: 1 },
  { name: "screenshots", maxCount: 10 },
]);

// Export the configured Multer middleware instance
module.exports = upload;
