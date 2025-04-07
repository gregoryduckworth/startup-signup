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

async function askLLMToFix(content, error, testTitle) {
  const prompt = `
The following Playwright test is failing:

Test name: "${testTitle}"
Error:
${error}

Here is the full test file content:
\`\`\`ts
${content}
\`\`\`

Please focus on suggesting a fix that directly addresses the failure described above. The fix should:

1. Correct only the issues causing the failure, without refactoring or changing unrelated code.
2. Keep the overall structure and logic of the test intact unless required for the fix.
3. Avoid introducing unnecessary code changes, such as re-importing libraries, modifying setup steps, or altering unrelated test cases.

Please suggest a solution that would likely resolve the failure while maintaining the integrity of the existing test.
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

function createBranchAndPR(branch, filePath, testTitle) {
  if (process.env.CI) {
    runCommand(`git config --global user.name "autofix-bot"`);
    runCommand(`git config --global user.email "autofix@example.com"`);
  }
  runCommand(`git reset --hard`);
  runCommand(`git clean -fd`);
  runCommand(`git checkout main`);
  runCommand(`git pull origin main`);
  runCommand(`git checkout -b ${branch} origin/main`);
  runCommand(`git add ${filePath}`);
  runCommand(`git commit -m "fix: auto-fix for failing test '${testTitle}'"`);
  runCommand(
    `git remote set-url origin https://x-access-token:${process.env.PAT_TOKEN}@github.com/${process.env.GITHUB_REPOSITORY}.git`
  );
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
  } else {
    console.log(`❌ Found ${failures.length} failing tests.`);
  }

  for (const { file, testTitle, error } of failures) {
    console.log(`🔍 Fixing test: ${testTitle} in ${file}`);

    const currentCode = getFileContent(file);
    const suggestion = await askLLMToFix(currentCode, error, testTitle);
    const fixedCode = extractCodeBlock(suggestion);

    writeFile(file, fixedCode);

    const branch = `autofix/${sanitize(basename(file, ".ts"))}-${sanitize(
      testTitle
    )}-${Date.now()}`;
    createBranchAndPR(branch, file, testTitle);
  }
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
