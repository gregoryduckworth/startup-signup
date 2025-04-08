import { readFileSync, writeFileSync } from "fs";
import { basename, dirname, join } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { OpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function sanitize(text) {
  return text.replace(/[^\w\d_-]+/g, "_").slice(0, 80);
}

function loadFailures(filePath = "results.json") {
  const fullPath = join(__dirname, filePath);
  const data = JSON.parse(readFileSync(fullPath, "utf8"));

  const testDir = data.config?.projects?.[0]?.testDir;
  if (!testDir) throw new Error("❌ testDir not found in results.json config");

  const failures = [];

  for (const suite of data.suites || []) {
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        if (test.results[0].status === "failed") {
          failures.push({
            file: join(testDir, spec.file),
            testTitle: spec.title,
            error: test.results[0].error.message,
            traceFile: join(testDir, "trace.zip"), // Add trace path
            videoFile: join(testDir, "videos", `${spec.file}.mp4`), // Add video path
          });
        }
      }
    }
  }

  return failures;
}

function getFileContent(filePath) {
  const fullPath = filePath.startsWith("/")
    ? filePath
    : join(process.cwd(), filePath);
  return readFileSync(fullPath, "utf8");
}

async function askLLMToFix(content, error, testTitle, traceFile, videoFile) {
  const prompt = `
  The following Playwright test is failing:

  Test name: "${testTitle}"
  Error:
  ${error}

  Here is the full test file content:
  \`\`\`ts
  ${content}
  \`\`\`

  Additional context:
  - Trace file: ${traceFile}
  - Video file: ${videoFile}

  Instructions:
  - Instead of providing the entire fixed code, please **only show the minimal changes** necessary in a **diff format** (e.g., with "+" and "-" markers for added or removed lines).
  - Do not remove important setup code, imports, or necessary dependencies unless they are directly related to the failure.
  - Focus only on fixing the issue causing the failure. Keep the surrounding code unchanged.
  - Only modify selectors, actions, or expectations that are directly causing the test failure.
  - You can however modify any related Page Object which could be causing the failure.
  - Avoid any refactoring or structural changes unless absolutely necessary.
  
  Please provide a diff of the changes required to fix the failure.
  `;
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  return response.choices[0].message.content;
}

function extractCodeBlock(text) {
  const match = text.match(/```(?:ts|javascript)?\n([\s\S]*?)```/);
  return match ? match[1].trim() : text;
}

function writeFile(filePath, content) {
  const fullPath = filePath.startsWith("/")
    ? filePath
    : join(process.cwd(), filePath);
  writeFileSync(fullPath, content, "utf8");
}

function runCommand(cmd) {
  console.log(`▶️ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

function checkChanges() {
  const status = execSync("git status -s").toString();
  console.log("Git status:", status);
  return status.trim() !== ""; // returns true if there are changes
}

function checkDiff() {
  const diff = execSync("git diff --cached").toString();
  console.log("Git diff:", diff);
  return diff.trim() !== ""; // returns true if there are changes in staged files
}

function createBranchAndPR(branch, filePath, testTitle, fixedCode) {
  if (process.env.CI) {
    runCommand(`git config --global user.name "autofix-bot"`);
    runCommand(`git config --global user.email "autofix@example.com"`);
  }

  // Ensure the working directory is clean before making changes
  runCommand(`git reset --hard`);
  runCommand(`git clean -fd`);

  // Pull from the remote main branch to ensure we're up to date
  runCommand(`git checkout main`);
  runCommand(`git pull origin main`);

  // Create and switch to the new branch, set it to track origin/main
  runCommand(`git checkout -b ${branch} origin/main`);

  // Write the fixed code to the file
  writeFile(filePath, fixedCode);

  // Check if there are changes to commit
  if (!checkChanges()) {
    console.log("No changes detected, skipping commit.");
    return;
  }

  runCommand(`git add ${filePath}`);

  // Check for staged diff (changes added to git index)
  if (!checkDiff()) {
    console.log("No changes detected in the staged diff, skipping commit.");
    return;
  }

  runCommand(`git commit -m "fix: auto-fix for failing test '${testTitle}'"`);
  if (!process.env.CI) {
    runCommand(
      `git remote set-url origin https://x-access-token:${process.env.PAT_TOKEN}@github.com/${process.env.GITHUB_REPOSITORY}.git`
    );
  }
  runCommand(`git push --set-upstream origin ${branch}`);
  runCommand(
    `gh pr create --title "🛠️ Auto-fix: ${testTitle}" --body "This PR auto-fixes the test '${testTitle}' using GPT-4." --base main`,
    {
      env: {
        GH_TOKEN: process.env.GITHUB_TOKEN,
      },
    }
  );
}

async function main() {
  const failures = loadFailures();
  if (!failures.length) {
    console.log("✅ No failing tests detected.");
    return;
  }

  for (const { file, testTitle, error, traceFile, videoFile } of failures) {
    console.log(`🔍 Fixing test: ${testTitle} in ${file}`);

    const currentCode = getFileContent(file);
    const suggestion = await askLLMToFix(
      currentCode,
      error,
      testTitle,
      traceFile,
      videoFile
    );
    const fixedCode = extractCodeBlock(suggestion);

    // Create the branch and PR
    const branch = `autofix/${sanitize(basename(file, ".ts"))}-${sanitize(
      testTitle
    )}-${Date.now()}`;
    createBranchAndPR(branch, file, testTitle, fixedCode);
  }
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
