// src/services/llmService.cjs
const axios = require("axios");
const config = require("../config.cjs"); // Import shared config

// Function to call LLM API
async function getLlmSuggestion(prompt) {
  // Check if LLM is configured using the flag from config.cjs
  if (!config.isLlmConfigured) {
    console.warn("[LLM Service] LLM configuration missing, skipping LLM call.");
    return {
      suggestion:
        "LLM integration is disabled (API Key or Endpoint not configured).",
      fixBlocks: [],
    };
  }

  try {
    // Make the POST request to the configured LLM endpoint
    const response = await axios.post(
      config.llmEndpoint, // Get endpoint from config
      {
        model: config.llmModel, // Get model name from config
        messages: [
          {
            role: "system",
            // The detailed system prompt instructing the LLM
            content: `You are an expert Playwright test automation engineer debugging a failing test.
Analyze the provided information (error, test code, imported files).
Provide a specific code fix.
Format your response ONLY using markdown code blocks.

**CRITICAL:** For each file you modify, you MUST provide the **COMPLETE, ENTIRE FILE CONTENT** with your fix applied within the markdown block. Do NOT provide just a snippet or diff.

Example for fixing 'tests/example.spec.ts':
\`\`\`typescript tests/example.spec.ts
// The *entire* content of tests/example.spec.ts, including imports,
// test setup, other tests, and your applied fix.
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page'; // Example import

test.describe('My Test Suite', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('failing test with fix', async ({ page }) => {
    // ... test steps ...
    // CORRECTED LINE HERE <--- Your fix applied
    // await page.locator('input[name="password"]').fill('correct-password'); // Example fix
    // ... rest of test steps ...
  });

  test('another test in the same file', async ({ page }) => {
    // This test should remain untouched unless the fix affects it.
    await expect(page).toHaveURL(/.*dashboard/);
  });
});
\`\`\`

If fixing multiple files, provide a separate block for EACH file, containing its FULL updated content.
Ensure the file path in the code block header is the RELATIVE path from the project root.
Include ONLY the code blocks, no other text, explanation, or preamble outside the blocks.
Ensure that you only change test setup code if is related to the failure and make sure that functionality is still kept.
In addition, if you spot a missing test case within the file, please add it.
If the test is failing due to data issues then ensure that is fixed first before altering any code.`,
          },
          { role: "user", content: prompt }, // The actual failure data and context
        ],
        temperature: 1, // Lower temperature for more deterministic code generation
        max_tokens: 3500, // Allow ample tokens for full file content
      },
      {
        headers: {
          // Get API key from config
          Authorization: `Bearer ${config.llmApiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 180000, // 3 minute timeout for the API call
      }
    );

    let rawSuggestion = "Could not extract suggestion from LLM response."; // Default message

    // Extract the main content from the response (adapt based on LLM provider)
    // This structure is common for OpenAI Chat Completions
    if (response.data?.choices?.[0]?.message?.content) {
      rawSuggestion = response.data.choices[0].message.content;
    } else if (response.data?.choices?.[0]?.text) {
      // Fallback for older models/formats
      rawSuggestion = response.data.choices[0].text;
    } else if (typeof response.data === "string") {
      // Handle plain string response
      rawSuggestion = response.data;
    }
    // Optional: Log raw suggestion snippet for debugging
    // console.log("LLM Raw Suggestion Snippet:", rawSuggestion.substring(0, 200) + "...");

    const fixBlocks = [];
    // Regex to find markdown code blocks with language and file path
    const codeBlockRegex = /```(\w+)\s+([\w\/\.\-\_]+)\s*([\s\S]*?)```/g;
    let match;

    // Iterate through all matches found in the raw suggestion
    while ((match = codeBlockRegex.exec(rawSuggestion)) !== null) {
      const language = match[1].trim(); // Captured language (e.g., typescript)
      const filePath = match[2].trim(); // Captured file path
      const code = match[3].trim(); // Captured code content

      if (code) {
        // Only add the block if it contains code
        fixBlocks.push({ language, filePath, code });
        console.log(`  Extracted fix block for: ${filePath}`);
      }
    }

    // If no blocks were extracted, return the raw suggestion (maybe it's just text)
    if (fixBlocks.length === 0 && rawSuggestion.length > 10) {
      // Check length to avoid returning tiny empty strings
      console.log(
        "LLM response did not contain formatted code blocks. Returning raw suggestion."
      );
      return { suggestion: rawSuggestion.trim(), fixBlocks: [] };
    }

    // Return both the original raw suggestion and the parsed code blocks
    return { suggestion: rawSuggestion.trim(), fixBlocks };
  } catch (error) {
    // Check if it's an Axios-specific error for more details
    if (axios.isAxiosError(error)) {
      console.error(`Axios Error: ${error.message}`);
      console.error(`Error Code: ${error.code}`);
      console.error(`Target URL: ${error.config?.url}`);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error(`Response Status: ${error.response.status}`);
        // Log the response data, which often contains specific error details from the LLM API
        console.error(
          "Response Data:",
          JSON.stringify(error.response.data, null, 2)
        );
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received from LLM server.");
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error setting up the request:", error.message);
      }
    } else {
      // Handle non-Axios errors (e.g., unexpected issues)
      console.error("Unknown Error during LLM call:", error);
    }
    // Return an error state
    return { suggestion: `LLM Call Failed: ${error.message}`, fixBlocks: [] };
  }
}

// Export the function for use in other modules
module.exports = { getLlmSuggestion };
