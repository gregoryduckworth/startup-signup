// src/api/analyze/analyze.controller.cjs
const path = require("path");
const codeAnalysis = require("../../utils/codeAnalysis.cjs");
const llmService = require("../../services/llmService.cjs");
const githubService = require("../../services/githubService.cjs");
const config = require("../../config.cjs"); // For REPO_ROOT_DIR

// This function contains the core logic previously inside the Multer callback
async function handleAnalyzeRequest(req, res) {
  // Although the route wrapper should handle missing body, check doesn't hurt
  if (!req.body) {
    console.error("[Controller] Error: req.body is unexpectedly undefined.");
    // If this happens, something is wrong with middleware order or setup
    // We should throw an error to be caught by the route's error handler
    throw new Error("Request body missing in controller.");
  }

  // Log received text fields (truncated)
  const requestBodyForLog = {};
  for (const key in req.body) {
    requestBodyForLog[key] = req.body[key]?.substring
      ? req.body[key].substring(0, 200) +
        (req.body[key].length > 200 ? "..." : "")
      : req.body[key];
  }
  console.log("Controller req.body (truncated):", requestBodyForLog);

  // Log uploaded file details
  if (!req.files) {
    console.warn("[Controller] Warning: req.files is undefined.");
  } else {
    const fileDetails = {};
    for (const fieldName in req.files) {
      fileDetails[fieldName] = req.files[fieldName].map((f) => ({
        name: f.filename,
        size: f.size,
      }));
    }
    console.log("[Controller] req.files details:", fileDetails);
  }

  const {
    testTitle,
    status,
    testFile, // Absolute path from reporter
    lineNumber,
    error: errorJsonString,
  } = req.body;

  // Basic validation (should ideally be done earlier, e.g., route level with validation middleware)
  if (!testFile) {
    console.error("[Controller] Error: Missing testFile path in request body.");
    // Throw error to be handled by the route's catch block -> global error handler
    throw new Error("Missing required field: testFile");
  }
  if (!testTitle || !lineNumber || !status) {
    console.warn(
      "[Controller] Warning: Missing one or more basic fields (testTitle, lineNumber, status)."
    );
    // Proceeding, but data might be incomplete
  }

  let prUrl = "Processing started but did not complete."; // Default status
  let finalLlmSuggestion = "LLM processing not reached.";
  let finalFixBlocks = [];
  let finalAnalysis = {};
  let errorData = {}; // To store parsed error details

  const originalTestFilePath = testFile; // Use absolute path from reporter
  console.log(
    "Processing analysis for Test:",
    testTitle,
    "| Status:",
    status,
    "| File:",
    originalTestFilePath,
    `(Line: ${lineNumber})`
  );

  // 1. Read Test File Content and Extract Context
  console.log("Reading source file and extracting context...");
  const testFileContent = codeAnalysis.readFileContent(originalTestFilePath);
  const { imports: testFileImports, snippet: codeSnippet } =
    codeAnalysis.getCodeContext(originalTestFilePath, lineNumber);
  const importedFilesContext = codeAnalysis.getImportedFilesContext(
    originalTestFilePath,
    testFileContent
  );
  console.log("Context extraction complete.");

  // 2. Basic Analysis (Parse error, run simple heuristics)
  let analysis = { suggestions: [] }; // Local analysis object
  try {
    errorData = JSON.parse(errorJsonString || "{}"); // Assign parsed error to outer scope variable
    console.log("Message:", errorData.message || "(No message)");

    // Apply simple heuristics based on error message
    if (
      errorData.message?.includes("Timeout") &&
      errorData.message?.includes("waiting for selector")
    ) {
      analysis.suggestions.push("Heuristic: Potential Selector Timeout.");
    } else if (errorData.message?.includes("expect(")) {
      analysis.suggestions.push("Heuristic: Potential Assertion Failure.");
    } else if (
      errorData.message?.includes("element is not visible") ||
      errorData.message?.includes("element is not stable")
    ) {
      analysis.suggestions.push(
        "Heuristic: Potential Element Visibility/Stability Issue."
      );
    }
    console.log("Heuristics applied:", analysis.suggestions.join(" "));
  } catch (parseError) {
    console.error("Error parsing received error JSON:", parseError);
    errorData = {
      parseError: `Failed to parse error JSON: ${parseError.message}`,
      rawErrorString: errorJsonString,
    }; // Store parse error info
  }
  finalAnalysis = analysis; // Store the result of basic analysis

  // 3. Build Prompt for LLM
  console.log("Building LLM prompt...");
  let importedFilesContentString = "";
  for (const [importPath, content] of Object.entries(importedFilesContext)) {
    importedFilesContentString += `\n\n--- Content of imported file: ${importPath} ---\n\`\`\`typescript\n${content}\n\`\`\``;
  }
  if (Object.keys(importedFilesContext).length === 0) {
    importedFilesContentString =
      "\n\n(No relevant relative imports found or read.)";
  }

  let relativeTestFilePathPrompt = originalTestFilePath; // Default to absolute if relative fails
  try {
    // Calculate relative path using configured repo root
    relativeTestFilePathPrompt = path
      .relative(config.repoRootDir, originalTestFilePath)
      .replace(/\\/g, "/");
  } catch (e) {
    console.warn(
      `[Controller] Could not calculate relative path using REPO_ROOT_DIR "${config.repoRootDir}", using absolute path. Error: ${e.message}`
    );
  }

  // Construct the full prompt string
  const llmPrompt = `Playwright Test Failure Analysis:\n\n**Test:** ${
    testTitle || "N/A"
  }\n**File:** ${relativeTestFilePathPrompt}\n**Failing Line:** ${
    lineNumber || "N/A"
  }\n**Status:** ${status || "N/A"}\n\n**Error Message:**\n\`\`\`\n${
    errorData.message || JSON.stringify(errorData) || "N/A"
  }\n\`\`\`\n\n**Stack Trace Snippet:**\n\`\`\`\n${(
    errorData.stack || "N/A"
  ).substring(0, 700)}...\n\`\`\`\n\n**Server Heuristics:**\n${
    analysis.suggestions.length > 0 ? analysis.suggestions.join("\n") : "None"
  }\n\n**Test File Imports:**\n\`\`\`typescript\n${
    testFileImports || "(Could not extract imports)"
  }\n\`\`\`\n\n**Code Snippet Around Failing Line (${lineNumber}) in ${relativeTestFilePathPrompt}:**\n\`\`\`typescript\n${codeSnippet}\n\`\`\`\n${importedFilesContentString}\n\n**Task:**\nAnalyse this Playwright test failure using all the provided context. Explain the likely root cause and provide corrected code snippets formatted ONLY in markdown blocks as requested in the system prompt (\`\`\`language path/relative/to/repo/root.ts ... \`\`\`). **CRITICAL:** Ensure each block contains the COMPLETE, ENTIRE file content with the fix applied. Ensure file paths in the code block headers are RELATIVE to the project root. Provide ONLY the code blocks, no extra text.`;
  console.log("LLM prompt constructed.");

  // 4. Call LLM Service
  console.log(`Starting LLM call for "${testTitle}"...`);
  const llmTimerLabel = `LLM_Call_Duration_${testTitle.replace(
    /[^a-zA-Z0-9]/g,
    "_"
  )}`;
  console.time(llmTimerLabel);
  const { suggestion: llmSuggestion, fixBlocks } =
    await llmService.getLlmSuggestion(llmPrompt);
  console.timeEnd(llmTimerLabel);
  finalLlmSuggestion = llmSuggestion; // Store LLM results
  finalFixBlocks = fixBlocks;
  console.log(
    `LLM Analysis complete for "${testTitle}". Found ${fixBlocks.length} fix blocks.`
  );
  // Log snippets for context
  console.log(
    "LLM Suggestion Snippet:",
    finalLlmSuggestion.substring(0, 200) + "..."
  );
  console.log(
    "Extracted Fix Blocks Summary:",
    finalFixBlocks.map((b) => ({
      filePath: b.filePath,
      code_length: b.code.length,
    }))
  );

  // 5. Create GitHub PR
  console.log(`Starting GitHub PR Step for "${testTitle}"...`);
  if (finalFixBlocks?.length > 0 && config.isGithubConfigured) {
    const githubTimerLabel = `GitHub_PR_Duration_${testTitle.replace(
      /[^a-zA-Z0-9]/g,
      "_"
    )}`;
    console.time(githubTimerLabel);
    prUrl = await githubService.createGitHubPR(testTitle, finalFixBlocks);
    console.timeEnd(githubTimerLabel);
  } else if (!config.isGithubConfigured) {
    prUrl = "PR creation skipped - GitHub credentials not configured.";
  } else {
    // No valid fix blocks
    prUrl = "PR creation skipped - LLM did not provide valid fix blocks.";
  }
  console.log(
    `GitHub PR step finished for "${testTitle}". PR URL / Status: ${prUrl}`
  );

  if (!res.headersSent) {
    // Final check before sending response
    res.status(200).json({
      message: "Analysis processed successfully by controller.",
      receivedData: {
        testTitle,
        status,
        testFile,
        lineNumber,
        error: errorData,
      },
      analysis: finalAnalysis,
      llmSuggestionRaw:
        finalLlmSuggestion.substring(0, 2000) +
        (finalLlmSuggestion.length > 2000 ? "..." : ""), // Truncated raw suggestion
      llmFixBlocks: finalFixBlocks, // Parsed code blocks
      prUrl: prUrl, // Result of PR creation attempt
    });
  } else {
    // This case should ideally not happen if error handling works correctly
    console.warn(
      `[Controller] Warning: Response headers already sent for "${testTitle}" before final success point.`
    );
  }
}

// Export the main handler function
module.exports = { handleAnalyzeRequest };
