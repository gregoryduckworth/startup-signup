const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 3001;

// --- Configuration ---
const UPLOAD_DIR = path.join(__dirname, "uploads"); // Directory to save uploaded files

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  console.log(`Creating upload directory: ${UPLOAD_DIR}`);
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// --- Multer Setup (for handling file uploads) ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create a subdirectory for each test run based on title/timestamp if desired
    // For simplicity, we save all to UPLOAD_DIR for now
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    // Prepend timestamp to avoid filename collisions
    const uniquePrefix = Date.now() + "-" + Math.round(Math.random() * 1e6);
    cb(null, uniquePrefix + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // Example Limit: 500MB per file
}).fields([
  // Define the expected file fields from the reporter
  { name: "trace", maxCount: 1 },
  { name: "video", maxCount: 1 },
  { name: "sourceCode", maxCount: 1 },
  { name: "screenshots", maxCount: 10 }, // Allow up to 10 screenshots
]);

// --- API Endpoint ---
app.post("/analyze", (req, res) => {
  console.log("\n--- Received request to /analyze ---");

  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      console.error("Multer Error:", err);
      return res
        .status(500)
        .json({ error: "File upload error: " + err.message });
    } else if (err) {
      // An unknown error occurred when uploading.
      console.error("Unknown Upload Error:", err);
      return res
        .status(500)
        .json({ error: "Unknown file upload error: " + err.message });
    }

    // --- File upload successful, now process data ---
    console.log("Upload Successful. Processing data...");
    console.log("Test Title:", req.body.testTitle);
    console.log("Status:", req.body.status);
    console.log(
      "Source File:",
      req.body.testFile,
      `(Line: ${req.body.lineNumber})`
    );

    // Log uploaded file details
    if (req.files) {
      console.log("Uploaded Files:");
      if (req.files.trace) console.log("  - Trace:", req.files.trace[0].path);
      if (req.files.video) console.log("  - Video:", req.files.video[0].path);
      if (req.files.sourceCode)
        console.log("  - Source Code:", req.files.sourceCode[0].path);
      if (req.files.screenshots) {
        req.files.screenshots.forEach((f) =>
          console.log("  - Screenshot:", f.path)
        );
      }
    } else {
      console.log("No files were uploaded.");
    }

    // --- Basic Analysis ---
    let analysis = { suggestions: [] };
    try {
      const errorData = JSON.parse(req.body.error || "{}");
      console.log("\n--- Error Details ---");
      console.log("Message:", errorData.message);
      // console.log('Stack:', errorData.stack); // Can be very long

      // Simple Heuristics
      if (
        errorData.message?.includes("Timeout") &&
        errorData.message?.includes("waiting for selector")
      ) {
        console.log("[Analysis] Potential Issue: Selector Timeout.");
        analysis.suggestions.push(
          "Check if the selector is correct and stable."
        );
        analysis.suggestions.push(
          "Consider adding explicit waits (e.g., `waitForSelector`, `waitForLoadState`)."
        );
        analysis.suggestions.push(
          "Inspect the trace file around the time of failure."
        );
      } else if (errorData.message?.includes("expect(")) {
        console.log("[Analysis] Potential Issue: Assertion Failure.");
        analysis.suggestions.push("Verify the expected vs. actual values.");
        analysis.suggestions.push(
          "Check application state and previous steps."
        );
        analysis.suggestions.push(
          "Consider if the assertion needs adjustment (e.g., `toContainText` vs `toHaveText`)."
        );
      } else if (
        errorData.message?.includes("element is not visible") ||
        errorData.message?.includes("element is not stable")
      ) {
        console.log(
          "[Analysis] Potential Issue: Element Visibility/Stability."
        );
        analysis.suggestions.push(
          "Ensure the element is not obscured or animating when interacted with."
        );
        analysis.suggestions.push(
          "Add waits for the element to be visible/stable (`toBeVisible`, `waitFor`)."
        );
        analysis.suggestions.push(
          "Check for overlaying elements in the trace DOM snapshots."
        );
      }
      // TODO: Add more heuristics based on common failure patterns

      console.log("\n--- Basic Suggestions ---");
      if (analysis.suggestions.length > 0) {
        analysis.suggestions.forEach((s) => console.log("  - " + s));
      } else {
        console.log(
          "  (No specific suggestions generated based on current heuristics)"
        );
      }
    } catch (parseError) {
      console.error("Error parsing error JSON:", parseError);
      console.log("Raw Error Body:", req.body.error); // Log raw string if JSON parsing fails
    }

    console.log("--- Analysis complete ---");
    res.status(200).json({
      message: "Analysis data received successfully.",
      receivedData: req.body, // Send back received text data
      files: req.files, // Send back file info
      analysis: analysis,
    });
  });
});

// --- Start Server ---
app.listen(port, () => {
  console.log(
    `Playwright Analysis Server listening at http://localhost:${port}`
  );
  console.log(`Uploaded files will be saved to: ${UPLOAD_DIR}`);
});
