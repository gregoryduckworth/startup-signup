const express = require("express");
const uploadMiddleware = require("../../middleware/uploadMiddleware.cjs");
const analyzeController = require("./analyze.controller.cjs");

const router = express.Router();

router.post("/", uploadMiddleware, async (req, res, next) => {
  if (!req.body || !req.files) {
    return next(
      new Error(
        "Internal Server Error: Failed to process form data correctly after upload."
      )
    );
  }

  try {
    await analyzeController.handleAnalyzeRequest(req, res);
  } catch (controllerError) {
    next(controllerError);
  }
});

module.exports = router;
