const fs = require("fs");
const path = require("path");

// Reads file content safely
function readFileContent(filePath) {
  if (!filePath) {
    console.warn(`Cannot read file, path is null or undefined.`);
    return null;
  }
  if (!fs.existsSync(filePath)) {
    console.warn(`Cannot read file, path does not exist: ${filePath}`);
    return null;
  }
  try {
    // Read the file synchronously
    return fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null; // Return null if reading fails
  }
}

// Extracts code snippet and imports from test file
function getCodeContext(testFilePath, lineNumber, contextLines = 5) {
  const fileContent = readFileContent(testFilePath);
  if (!fileContent) {
    // Return specific error messages if file couldn't be read
    return {
      imports: `Could not read test file: ${testFilePath}`,
      snippet: `Could not read test file: ${testFilePath}`,
    };
  }

  const lines = fileContent.split("\n");
  // Regex to capture various import styles, including type imports
  const imports = lines
    .filter((line) =>
      /^\s*import(\s+type)?\s+.*\s+from\s+['"].*['"]/.test(line)
    )
    .join("\n");

  let snippet = "Could not generate snippet."; // Default snippet error
  try {
    const targetLine = parseInt(lineNumber, 10) - 1; // Convert to 0-based index

    // Validate line number
    if (isNaN(targetLine) || targetLine < 0 || targetLine >= lines.length) {
      snippet = `Invalid line number (${lineNumber}) provided for file with ${lines.length} lines.`;
      console.warn(`[getCodeContext] ${snippet}`);
    } else {
      // Calculate start and end lines for the snippet, handling boundaries
      const startLine = Math.max(0, targetLine - contextLines);
      const endLine = Math.min(lines.length, targetLine + contextLines + 1); // +1 because slice is exclusive of end index
      const snippetLines = lines.slice(startLine, endLine);

      // Format snippet with line numbers and indicator for the failing line
      snippet = snippetLines
        .map((line, index) => {
          const currentLineNumber = startLine + index + 1; // Calculate actual line number
          // Indicate the failing line with '>'
          const prefix =
            currentLineNumber === targetLine + 1
              ? `>${currentLineNumber}`.padStart(5)
              : `${currentLineNumber}`.padStart(5);
          return `${prefix}: ${line}`; // Combine line number and code
        })
        .join("\n"); // Join lines back with newline
    }
  } catch (error) {
    console.error(
      `[getCodeContext] Error generating snippet for ${testFilePath}:`,
      error
    );
    snippet = `Error generating code snippet: ${error.message}`; // Report error in snippet
  }

  return { imports, snippet }; // Return extracted imports and the formatted snippet
}

// Finds relative imports, resolves paths, and reads file content
function getImportedFilesContext(testFilePath, testFileContent) {
  if (!testFilePath || !testFileContent) return {}; // Return empty object if input is invalid

  // Regex to capture relative paths (starting with ./ or ../) from import statements
  const importRegex = /import\s+(type\s+)?.*\s+from\s+['"](\.\.?\/[^"']*)['"]/g;
  let match;
  const importedFiles = {}; // Object to store { 'relativePath': 'fileContent' }
  const testFileDir = path.dirname(testFilePath); // Directory of the test file

  while ((match = importRegex.exec(testFileContent)) !== null) {
    const relativePath = match[2]; // The captured relative path (e.g., '../pages/login')

    // Filter for likely code files based on extension or lack thereof
    const allowedExtensions = [
      ".ts",
      ".js",
      ".cjs",
      ".mjs",
      ".page",
      ".component",
      ".util",
      ".helper",
    ];
    const seemsLikeCode =
      allowedExtensions.some((ext) => relativePath.endsWith(ext)) ||
      !path.extname(relativePath); // Allow extensionless imports

    if (!seemsLikeCode) {
      console.log(`  Skipping likely non-code import: ${relativePath}`);
      continue; // Skip if it doesn't look like a code file
    }

    try {
      let resolvedPath = null;
      // Define potential paths to check (direct, .ts, .js, index files)
      const potentialPaths = [
        relativePath,
        relativePath + ".ts",
        relativePath + ".js",
        relativePath + ".cjs",
        relativePath + ".mjs",
        path.join(relativePath, "index.ts"), // Handle directory imports (index.ts)
        path.join(relativePath, "index.js"), // Handle directory imports (index.js)
        path.join(relativePath, "index.cjs"),
        path.join(relativePath, "index.mjs"),
      ];

      // Try resolving each potential path relative to the test file's directory
      for (const p of potentialPaths) {
        const absPath = path.resolve(testFileDir, p); // Get absolute path
        // Check if it exists and is a file
        if (fs.existsSync(absPath) && fs.statSync(absPath).isFile()) {
          resolvedPath = absPath; // Found a valid file
          break; // Stop checking potentials for this import
        }
      }

      if (resolvedPath) {
        console.log(
          `  Found relevant import: ${relativePath} -> ${resolvedPath}`
        );
        const content = readFileContent(resolvedPath); // Read the content of the resolved file
        if (content) {
          // Truncate large files to prevent exceeding LLM token limits
          const maxChars = 10000; // Max characters to include (adjust as needed)
          importedFiles[relativePath] = // Store content keyed by the original relative path
            content.length > maxChars
              ? content.substring(0, maxChars) + "\n... [TRUNCATED]" // Add truncation notice
              : content;
          console.log(
            `    -> Read content (length: ${content.length}, added to context)`
          );
        } else {
          console.log(
            `    -> Failed to read content for resolved path: ${resolvedPath}`
          );
        }
      } else {
        // Log if no valid file was found for the relative path
        console.log(
          `    -> Could not resolve import or file not found for: ${relativePath}`
        );
      }
    } catch (error) {
      // Catch errors during path resolution or file stats
      console.error(`  Error processing import ${relativePath}:`, error);
    }
  }
  return importedFiles; // Return the object containing imported file contents
}

// Export the functions for use in other modules
module.exports = {
  readFileContent,
  getCodeContext,
  getImportedFilesContext,
};
