// src/services/githubService.cjs
const path = require("path");
const config = require("../config.cjs"); // Import shared config

async function createGitHubPR(testTitle, fixBlocks) {
  // Check if GitHub integration is configured
  if (!config.isGithubConfigured) {
    console.log(
      "[GitHub Service] GitHub credentials not set. Skipping PR creation."
    );
    return "GitHub credentials not configured.";
  }
  // Check if there are any code blocks to process
  if (!fixBlocks || fixBlocks.length === 0) {
    console.log(
      "[GitHub Service] No valid code fix blocks provided by LLM. Skipping PR creation."
    );
    return "No PR created - LLM did not provide code blocks.";
  }

  // Dynamically import Octokit
  const { Octokit } = await import("@octokit/rest");
  const octokit = new Octokit({ auth: config.githubToken }); // Use token from config
  let newBranchName; // Variable to hold the new branch name for potential cleanup

  try {
    const { data: repoData } = await octokit.repos.get({
      owner: config.githubOwner, // Use owner from config
      repo: config.githubRepo, // Use repo from config
    });
    const default_branch = repoData.default_branch;
    console.log(`  Default branch: ${default_branch}`);

    // 2. Get the SHA of the latest commit on the default branch
    const { data: refData } = await octokit.git.getRef({
      owner: config.githubOwner,
      repo: config.githubRepo,
      ref: `heads/${default_branch}`,
    });
    const latestSha = refData.object.sha;
    console.log(`  Latest SHA on ${default_branch}: ${latestSha}`);

    // 3. Create a unique name for the new branch
    const timestamp = new Date()
      .toISOString()
      .replace(/[:\-T\.]/g, "")
      .slice(0, 12);
    const sanitizedTitle = testTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .substring(0, 30);
    newBranchName = `fix/llm-${sanitizedTitle}-${timestamp}`; // Assign branch name
    console.log(`  Creating new branch: ${newBranchName}`);

    // 4. Create the new branch pointing to the latest commit SHA
    await octokit.git.createRef({
      owner: config.githubOwner,
      repo: config.githubRepo,
      ref: `refs/heads/${newBranchName}`,
      sha: latestSha,
    });

    const changesMade = []; // Keep track of files actually modified

    // 5. Process each code block provided by the LLM
    for (const block of fixBlocks) {
      const githubPath = block.filePath; // Relative path from LLM response
      const newContent = block.code; // Full file content from LLM response
      console.log(`  Processing fix for file: ${githubPath}`);

      let currentSha = null; // SHA of the existing file (if it exists)
      let originalContent = ""; // Content of the existing file

      // 5a. Get current content and SHA of the file *on the new branch*
      try {
        const { data: fileData } = await octokit.repos.getContent({
          owner: config.githubOwner,
          repo: config.githubRepo,
          path: githubPath,
          ref: newBranchName, // Important: fetch from the new branch
        });
        currentSha = fileData.sha;
        originalContent = Buffer.from(fileData.content, "base64").toString(
          "utf-8"
        );
        console.log(`    -> Fetched current SHA: ${currentSha}`);
      } catch (error) {
        // If file not found (404), it's a new file creation
        if (error.status === 404) {
          console.log(
            `    -> File not found: ${githubPath}. Assuming new file creation.`
          );
          originalContent = ""; // No original content
          currentSha = null; // No SHA for new files
        } else {
          // Rethrow other errors (e.g., permission issues)
          console.error(
            `    -> Error fetching file content for ${githubPath}:`,
            error.status,
            error.message
          );
          throw error;
        }
      }

      // 5b. Compare original content with new content to see if changes are needed
      const normalizedOriginal = originalContent.replace(/\r\n/g, "\n").trim();
      const normalizedNew = newContent.replace(/\r\n/g, "\n").trim();

      if (normalizedOriginal === normalizedNew) {
        console.log(
          `    -> No actual changes detected for ${githubPath}. Skipping commit.`
        );
        continue; // Go to the next code block
      }

      // 5c. Sanity Check: Prevent accidental deletion by checking line counts
      const originalLines = normalizedOriginal.split("\n").length;
      const newLines = normalizedNew.split("\n").length;
      if (
        originalContent && // Only check if the original file had content
        ((originalLines > 10 && newLines < originalLines * 0.5) || // Significantly shorter
          (newLines < 3 && originalLines > 3)) // Very short when original wasn't
      ) {
        console.warn(
          `    -> WARNING: New content for ${githubPath} (${newLines} lines) is significantly shorter than original (${originalLines} lines). Skipping commit for safety.`
        );
        continue; // Skip this potentially destructive change
      }

      // 5d. If changes are valid, proceed to commit
      console.log(
        `    -> Changes detected (${originalLines} -> ${newLines} lines). Proceeding with commit.`
      );
      changesMade.push(githubPath); // Track that this file was changed

      // Determine commit message based on whether it's an update or creation
      const commitMessage = currentSha
        ? `Fix: Apply LLM patch to ${path.basename(githubPath)}`
        : `Feat: Create ${path.basename(githubPath)} with LLM suggestion`;

      // 5e. Commit the changes to the new branch
      await octokit.repos.createOrUpdateFileContents({
        owner: config.githubOwner,
        repo: config.githubRepo,
        path: githubPath,
        message: commitMessage,
        content: Buffer.from(newContent).toString("base64"), // Content must be base64 encoded
        sha: currentSha, // Required for updates, omitted/null for creates
        branch: newBranchName, // Commit to the new branch
      });
      console.log(
        `    -> Committed changes for ${githubPath} to branch ${newBranchName}`
      );
    } // End loop through fixBlocks

    // 6. Check if any actual changes were committed
    if (changesMade.length === 0) {
      console.log(
        "[GitHub Service] No files were actually changed by the LLM suggestions. Deleting branch and skipping PR creation."
      );
      // Clean up the newly created branch if no changes were made
      try {
        await octokit.git.deleteRef({
          owner: config.githubOwner,
          repo: config.githubRepo,
          ref: `heads/${newBranchName}`, // Delete the branch ref
        });
        console.log(`  Deleted unused branch: ${newBranchName}`);
      } catch (deleteError) {
        // Log error if deletion fails, but proceed
        console.error(
          `  Failed to delete unused branch ${newBranchName}:`,
          deleteError.message
        );
      }
      return "No PR created - LLM suggestions did not change file content.";
    }

    // 7. Create the Pull Request if changes were made
    console.log(
      `  Creating Pull Request from ${newBranchName} to ${default_branch}`
    );
    const prTitle = `🤖 Fix: Apply LLM Suggestions for "${testTitle}"`;
    const prBody = `This Pull Request applies automated fixes suggested by an LLM for failures detected in the test: **${testTitle}**.

**Files Modified:**
${changesMade.map((f) => `- \`${f}\``).join("\n")}

*Please review these changes carefully before merging. Verify that the full file content looks correct and no functionality was unintentionally removed.*`;

    const { data: prData } = await octokit.pulls.create({
      owner: config.githubOwner,
      repo: config.githubRepo,
      title: prTitle,
      head: newBranchName, // Source branch
      base: default_branch, // Target branch
      body: prBody,
      // maintainer_can_modify: true, // Optional: Allow maintainers to edit the PR branch
      // draft: false,               // Optional: Create as ready for review (false) or draft (true)
    });

    return prData.html_url; // Return the URL of the created PR
  } catch (error) {
    // Catch errors during the GitHub API interaction
    console.error("Error Status:", error.status); // e.g., 401, 403, 422, 500
    console.error("Error Message:", error.message);
    // Log details from Octokit's request/response if available
    if (error.request) {
      console.error("Request:", error.request.method, error.request.url);
    }
    if (error.response && error.response.data) {
      // Often contains detailed validation errors from GitHub API
      console.error(
        "Response Data:",
        JSON.stringify(error.response.data, null, 2)
      );
    }

    // Attempt to clean up the created branch if the process failed
    if (newBranchName) {
      try {
        console.log(`Attempting to clean up failed branch: ${newBranchName}`);
        await octokit.git.deleteRef({
          owner: config.githubOwner,
          repo: config.githubRepo,
          ref: `heads/${newBranchName}`,
        });
        console.log(`  Cleaned up failed branch: ${newBranchName}`);
      } catch (cleanupError) {
        // Log cleanup failure but don't override the original error
        console.error(
          `  Failed to clean up branch ${newBranchName} after error:`,
          cleanupError.message
        );
      }
    }
    // Return an error message
    return `GitHub PR creation failed: ${error.message}`;
  }
}

// Export the function for use in other modules
module.exports = { createGitHubPR };
