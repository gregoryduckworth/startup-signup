import type {
  Reporter,
  FullConfig,
  FullResult,
  Suite,
  TestCase,
  TestResult,
  TestError,
} from "@playwright/test/reporter";
import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";

class AnalysisReporter implements Reporter {
  private analysisServerUrl = "http://localhost:3001/analyze"; // Your server endpoint
  private outputDir: string = "test-results"; // Default, will be updated from config

  onBegin(config: FullConfig, suite: Suite): void {
    // Store the configured output directory
    this.outputDir = config.rootDir
      ? path.resolve(config.rootDir, config.projects[0].outputDir)
      : config.projects[0].outputDir;
    console.log(`Analysis Reporter: Output directory set to ${this.outputDir}`);
    console.log(
      `Analysis Reporter: Sending failed test data to ${this.analysisServerUrl}`
    );
  }

  onTestEnd(test: TestCase, result: TestResult): void | Promise<void> {
    // Send data only on failure or timeout
    if (result.status === "failed" || result.status === "timedOut") {
      console.log(
        `[Analysis Reporter] Test Failed: ${test.title}. Status: ${result.status}. Preparing data...`
      );
      this.sendAnalysisData(test, result).catch((err) => {
        console.error(
          `[Analysis Reporter] ERROR: Failed to send data for "${test.title}" to analysis server:`,
          err.message || err
        );
      });
    } else {
      // Optional: Log skipped or passed tests if needed
      // console.log(`[Analysis Reporter] Test ${result.status}: ${test.title}`);
    }
  }

  onEnd(result: FullResult): void | Promise<void> {
    console.log(
      `[Analysis Reporter] Test run finished with status: ${result.status}`
    );
  }

  // Helper function to safely get artifact paths
  private async getArtifactPath(
    artifact: any | undefined
  ): Promise<string | null> {
    if (!artifact) return null;
    try {
      const artifactPath = await artifact.path();
      if (artifactPath && fs.existsSync(artifactPath)) {
        return artifactPath;
      }
    } catch (e) {
      // path() might throw if the artifact wasn't saved (e.g., if test passed before trace finished)
      console.warn(
        `[Analysis Reporter] Warning: Could not get path for artifact: ${e.message}`
      );
    }
    return null;
  }

  async sendAnalysisData(test: TestCase, result: TestResult) {
    const formData = new FormData();

    // --- Basic Info ---
    formData.append("testTitle", test.title);
    formData.append("testFile", test.location.file);
    formData.append("lineNumber", test.location.line.toString());
    formData.append("status", result.status);
    formData.append("duration", result.duration.toString());
    formData.append("retries", result.retry.toString());

    // --- Error Details ---
    if (result.error) {
      formData.append(
        "error",
        JSON.stringify(
          {
            message: result.error.message || "No message",
            stack: result.error.stack || "No stack trace",
            value: result.error.value, // Can sometimes contain useful context
          },
          null,
          2
        )
      ); // Pretty print JSON
    } else {
      formData.append(
        "error",
        JSON.stringify({ message: "No error object reported" })
      );
    }

    // --- Console Logs ---
    // Note: Capturing full stdout/stderr might require specific runner configuration or adjustments
    formData.append(
      "stdout",
      result.stdout.map((b) => b.toString()).join("\n")
    );
    formData.append(
      "stderr",
      result.stderr.map((b) => b.toString()).join("\n")
    );

    // --- Artifacts ---
    let tracePath: string | null = null;
    let videoPath: string | null = null;
    let screenshotPaths: string[] = [];

    // Iterate through attachments to find trace, video, screenshots
    for (const attachment of result.attachments) {
      if (
        attachment.name === "trace" &&
        attachment.path &&
        fs.existsSync(attachment.path)
      ) {
        tracePath = attachment.path;
        console.log(`[Analysis Reporter] Found trace: ${tracePath}`);
        formData.append("trace", fs.createReadStream(tracePath), {
          filename: path.basename(tracePath),
          contentType: "application/zip",
        });
      } else if (
        attachment.name === "video" &&
        attachment.path &&
        fs.existsSync(attachment.path)
      ) {
        videoPath = attachment.path;
        console.log(`[Analysis Reporter] Found video: ${videoPath}`);
        formData.append("video", fs.createReadStream(videoPath), {
          filename: path.basename(videoPath),
          contentType: "video/webm",
        });
      } else if (
        attachment.name === "screenshot" &&
        attachment.path &&
        fs.existsSync(attachment.path)
      ) {
        console.log(`[Analysis Reporter] Found screenshot: ${attachment.path}`);
        screenshotPaths.push(attachment.path);
        // Send multiple screenshots if they exist
        formData.append("screenshots", fs.createReadStream(attachment.path), {
          filename: path.basename(attachment.path),
          contentType: attachment.contentType,
        });
      }
    }

    if (!tracePath)
      console.warn(
        `[Analysis Reporter] Trace file not found or accessible for failed test: ${test.title}`
      );
    if (!videoPath)
      console.warn(
        `[Analysis Reporter] Video file not found or accessible for failed test: ${test.title}`
      );

    // --- Source Code ---
    const sourcePath = test.location.file;
    if (sourcePath && fs.existsSync(sourcePath)) {
      console.log(`[Analysis Reporter] Found source code: ${sourcePath}`);
      formData.append("sourceCode", fs.createReadStream(sourcePath), {
        filename: path.basename(sourcePath),
        contentType: "text/plain", // Adjust if needed (e.g., text/typescript)
      });
    } else {
      console.warn(
        `[Analysis Reporter] Source code file not found: ${sourcePath}`
      );
    }

    // --- Send Data ---
    try {
      console.log(
        `[Analysis Reporter] Sending analysis data for "${test.title}"...`
      );
      const response = await axios.post(this.analysisServerUrl, formData, {
        headers: formData.getHeaders(), // Important for multipart/form-data
        maxBodyLength: Infinity, // Allow large uploads (traces/videos can be big)
        maxContentLength: Infinity,
      });
      console.log(
        `[Analysis Reporter] Server Response for "${test.title}":`,
        response.status,
        response.statusText
      );
    } catch (error: any) {
      // Log more detailed error information if available
      if (axios.isAxiosError(error)) {
        console.error(
          `[Analysis Reporter] Axios Error sending data for "${test.title}": ${error.message}`,
          error.response?.status,
          error.response?.data
        );
      } else {
        console.error(
          `[Analysis Reporter] Non-Axios Error sending data for "${test.title}":`,
          error.message || error
        );
      }
    }
  }
}

export default AnalysisReporter;
