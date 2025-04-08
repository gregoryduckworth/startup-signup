const express = require("express");
const config = require("./src/config.cjs");
const analyzeRouter = require("./src/api/analyze/analyze.route.cjs");

const app = express();

// --- Global Middleware ---
app.use((req, res, next) => {
  console.log(
    `[GLOBAL] [${new Date().toISOString()}] ${req.method} ${req.originalUrl}`
  );
  res.on("finish", () => {
    console.log(
      `[GLOBAL] [${new Date().toISOString()}] ${req.method} ${
        req.originalUrl
      } - Response Sent: ${res.statusCode}`
    );
  });
  next();
});

// --- Mount API Routes ---
app.use("/analyze", analyzeRouter);

// --- Basic Root Route ---
app.get("/", (req, res) => {
  res.send(`Playwright Analysis Server is running. Use POST /analyze.`);
});

// --- Global Error Handler (Catches errors passed via next(err)) ---
app.use((err, req, res, next) => {
  console.error("--- UNHANDLED ERROR ---");
  console.error("Error Message:", err.message);
  console.error("Error Code:", err.code); // Log code if available (e.g., from Multer)
  console.error("Error Stack:", err.stack);

  if (!res.headersSent) {
    // Attempt to send a generic error response
    const statusCode = err.status || 500; // Use error status or default to 500
    res.status(statusCode).json({
      message: "An unexpected server error occurred.",
      error: err.message, // Include error message
      code: err.code, // Include error code if present
    });
  } else {
    // If headers already sent, just end the response (or let default handler do it)
    console.error("Headers already sent, cannot send error JSON response.");
    next(err); // Pass to default Express handler if needed
  }
});

// --- Start Server ---
app.listen(config.port, () => {
  console.log(
    `Playwright Analysis Server listening at http://localhost:${config.port}`
  );
  console.log(`Uploaded files will be saved to: ${config.uploadDir}`);
  console.log(`Expected Repo Root: ${config.repoRootDir}`);
  if (!config.isLlmConfigured) {
    console.log("WARNING: LLM integration disabled.");
  } else {
    console.log(`LLM Integration Enabled`);
  }
  if (!config.isGithubConfigured) {
    console.log("WARNING: GitHub integration disabled.");
  } else {
    console.log(`GitHub Integration Enabled`);
  }
});
