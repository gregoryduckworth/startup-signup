import { readFileSync, writeFileSync } from "fs";
import { basename, dirname, join } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadFailures(filePath = "results.json") {
  const fullPath = join(__dirname, filePath);
  const data = JSON.parse(readFileSync(fullPath, "utf8"));

  const testDir = data.config?.projects?.[0]?.testDir;
  if (!testDir) throw new Error("❌ testDir not found in results.json config");

  for (const suite of data.suites || []) {
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        if (test.results[0].status === "failed") {
          return {
            file: join(testDir, spec.file),
            testTitle: spec.title,
            error: test.results[0].error.message,
          };
        }
      }
    }
  }

  return null;
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

Please suggest a corrected version of this file that would likely fix the failure. Only make minimal and relevant changes.
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

function createBranchAndPR(branch, filePath) {
  runCommand(`git config --global user.name "autofix-bot"`);
  runCommand(`git config --global user.email "autofix@example.com"`);
  runCommand(`git checkout -b ${branch}`);
  runCommand(`git pull origin ${branch} --rebase`);
  runCommand(`git add ${filePath}`);
  runCommand(`git commit -m "fix: auto-fix for failing test"`);
  runCommand(
    `git remote set-url origin https://x-access-token:${process.env.PAT_TOKEN}@github.com/${process.env.GITHUB_REPOSITORY}.git`
  );
  runCommand(`git push --set-upstream origin ${branch}`);
  runCommand(
    `gh pr create --title "🛠️ Auto-fix for failing Playwright test" --body "This PR was generated automatically to fix a failing test using GPT-4." --base main`
  );
}

async function main() {
  const failure = loadFailures();
  if (!failure) {
    console.log("✅ No failing tests detected.");
    return;
  }

  const { file, testTitle, error } = failure;

  console.log(`🔍 Fixing test: ${testTitle} in ${file}`);
  const currentCode = getFileContent(file);
  const suggestion = await askLLMToFix(currentCode, error, testTitle);
  const fixedCode = extractCodeBlock(suggestion);

  writeFile(file, fixedCode);

  const branch = `autofix/${basename(file, ".ts")}`;
  createBranchAndPR(branch, file);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
