// src/config.cjs
require("dotenv").config();
const path = require("path");
const fs = require("fs");

const config = {
  port: process.env.PORT || 3001,
  uploadDir: path.join(__dirname, "..", "uploads"),
  repoRootDir: path.resolve(
    __dirname,
    "..",
    process.env.REPO_ROOT_RELATIVE_PATH || ".."
  ),

  llmApiKey: process.env.LLM_API_KEY,
  llmEndpoint: process.env.LLM_ENDPOINT,
  llmModel: process.env.LLM_MODEL || "gpt-4",

  githubToken: process.env.GITHUB_TOKEN,
  githubOwner: process.env.GITHUB_OWNER,
  githubRepo: process.env.GITHUB_REPO,

  // --- Derived Values & Validation ---
  isLlmConfigured: !!(process.env.LLM_API_KEY && process.env.LLM_ENDPOINT),
  isGithubConfigured: !!(
    process.env.GITHUB_TOKEN &&
    process.env.GITHUB_OWNER &&
    process.env.GITHUB_REPO
  ),
};

// --- Input Validation Logging ---
if (!config.isLlmConfigured) {
  console.warn(`
    *********************************************************************
    WARNING: LLM_API_KEY or LLM_ENDPOINT environment variable not set.
             LLM fix suggestions will be disabled.
    *********************************************************************
    `);
}

if (!config.isGithubConfigured) {
  console.warn(`
    *********************************************************************
    WARNING: GITHUB_TOKEN, GITHUB_OWNER, or GITHUB_REPO environment variable not set.
             GitHub PR creation will be disabled.
    *********************************************************************
    `);
}

if (!fs.existsSync(config.uploadDir)) {
  console.log(`Creating upload directory: ${config.uploadDir}`);
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

module.exports = config;
