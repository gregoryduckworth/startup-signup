// custom-reporter.ts (Temporary Version for Testing - NO TRACE/VIDEO)

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
import FormData from "form-data"; // Ensure you have form-data installed

class AnalysisReporter implements Reporter {
  // Ensure the URL matches your server endpoint EXACTLY (e.g., /analyze vs /analyse)
  private analysisServerUrl =
    process.env.ANALYSIS_SERVER_URL || "http://localhost:3001/analyze";
  private outputDir: string = "test-results";

  onBegin(config: FullConfig, suite: Suite): void {
    // Safer way to get outputDir if multiple projects exist
    this.outputDir = config.rootDir
      ? path.resolve(
          config.rootDir,
          config.projects[0]?.outputDir || "test-results"
        )
      : config.projects[0]?.outputDir || "test-results";
    console.log(
      `[Analysis Reporter] Output directory set to ${this.outputDir}`
    );
    console.log(
      `[Analysis Reporter] Sending failed test data to ${this.analysisServerUrl}`
    );
  }

  onTestEnd(test: TestCase, result: TestResult): void | Promise<void> {
    if (result.status === "failed" || result.status === "timedOut") {
      console.log(
        `>>> [Analysis Reporter] TEST FAILED: ${test.title}. Preparing data...`
      );
      console.log(
        `[Analysis Reporter] Calling sendAnalysisData for "${test.title}"`
      );
      this.sendAnalysisData(test, result).catch((err) => {
        console.error(
          `[Analysis Reporter] UNHANDLED ERROR during sendAnalysisData for "${test.title}":`,
          err?.message || err,
          err?.stack
        );
      });
      console.log(
        `[Analysis Reporter] sendAnalysisData call initiated for "${test.title}"`
      );
    }
  }

  async sendAnalysisData(test: TestCase, result: TestResult) {
    console.log(
      `[Analysis Reporter] Inside sendAnalysisData for "${test.title}"`
    );
    const formData = new FormData();
    let fileAppendError = false;

    try {
      // --- Basic Info, Error, Logs --- (Keep as before)
      console.log(
        `[Analysis Reporter] Appending basic info for "${test.title}"`
      );
      formData.append("testTitle", test.title);
      formData.append("testFile", test.location.file);
      formData.append("lineNumber", test.location.line.toString());
      formData.append("status", result.status);
      formData.append("duration", result.duration.toString());
      formData.append("retries", result.retry.toString());
      if (result.error) {
        formData.append(
          "error",
          JSON.stringify(
            {
              message: result.error.message || "No message",
              stack: result.error.stack || "No stack trace",
            },
            null,
            2
          )
        );
      } else {
        formData.append(
          "error",
          JSON.stringify({ message: "No error object reported" })
        );
      }
      formData.append(
        "stdout",
        result.stdout.map((b) => b.toString("utf-8")).join("\n")
      );
      formData.append(
        "stderr",
        result.stderr.map((b) => b.toString("utf-8")).join("\n")
      );
      console.log(
        `[Analysis Reporter] Appended basic info and logs for "${test.title}"`
      );

      // --- Artifacts (MODIFIED FOR TESTING) ---
      console.log(
        `[Analysis Reporter] Processing attachments for "${test.title}"`
      );
      const attachmentsToSend: {
        field: string;
        path: string;
        filename: string;
        contentType: string;
      }[] = [];
      for (const attachment of result.attachments) {
        console.log(
          `[Analysis Reporter] Checking attachment: Name='${attachment.name}', Path='${attachment.path}'`
        );
        if (attachment.path && fs.existsSync(attachment.path)) {
          const baseName = path.basename(attachment.path);

          // ***** START TEMPORARY MODIFICATION *****
          // Comment out trace and video to test without large files
          if (attachment.name === "trace") {
            console.log(
              `[Analysis Reporter] Preparing to add trace: ${attachment.path}`
            );
            attachmentsToSend.push({
              field: "trace",
              path: attachment.path,
              filename: baseName,
              contentType: "application/zip",
            });
          } else if (attachment.name === "video") {
            console.log(
              `[Analysis Reporter] Preparing to add video: ${attachment.path}`
            );
            attachmentsToSend.push({
              field: "video",
              path: attachment.path,
              filename: baseName,
              contentType: "video/webm",
            });
          } else if (attachment.name === "screenshot") {
            // KEEP SCREENSHOTS
            console.log(
              `[Analysis Reporter] Preparing to add screenshot: ${attachment.path}`
            );
            attachmentsToSend.push({
              field: "screenshots",
              path: attachment.path,
              filename: baseName,
              contentType: attachment.contentType,
            });
          }
          // ***** END TEMPORARY MODIFICATION *****
        } else if (attachment.path) {
          console.warn(
            `[Analysis Reporter] Attachment path no longer exists just before adding: ${attachment.path} for attachment named ${attachment.name}`
          );
        } else {
          console.log(
            `[Analysis Reporter] Attachment named '${attachment.name}' has no path.`
          );
        }
      }

      // --- Source Code (Keep adding source code) ---
      const sourcePath = test.location.file;
      console.log(
        `[Analysis Reporter] Checking source code path: ${sourcePath}`
      );
      if (sourcePath && fs.existsSync(sourcePath)) {
        console.log(
          `[Analysis Reporter] Preparing to add source code: ${sourcePath}`
        );
        attachmentsToSend.push({
          field: "sourceCode",
          path: sourcePath,
          filename: path.basename(sourcePath),
          contentType: "text/plain",
        });
      } else {
        console.warn(
          `[Analysis Reporter] Source code file not found or path invalid: ${sourcePath}`
        );
      }

      // Append ONLY the selected files (screenshot, sourceCode)
      console.log(
        `[Analysis Reporter] Appending ${attachmentsToSend.length} files (NO TRACE/VIDEO) to FormData for "${test.title}"`
      );
      for (const att of attachmentsToSend) {
        console.log(
          `[Analysis Reporter] Attempting to append file: ${att.filename} (Path: ${att.path})`
        );
        try {
          if (!fs.existsSync(att.path)) {
            console.error(
              `[Analysis Reporter] CRITICAL ERROR: File disappeared before streaming: ${att.path}`
            );
            fileAppendError = true;
            continue;
          }
          const fileStream = fs.createReadStream(att.path);
          fileStream.on("error", (streamErr) => {
            console.error(
              `[Analysis Reporter] Error reading stream for ${att.filename}: ${streamErr.message}`
            );
            fileAppendError = true;
          });
          formData.append(att.field, fileStream, {
            filename: att.filename,
            contentType: att.contentType,
          });
          console.log(
            `[Analysis Reporter] Successfully appended ${att.filename} to FormData.`
          );
        } catch (streamError: any) {
          console.error(
            `[Analysis Reporter] Error creating read stream or appending ${att.filename}: ${streamError.message}`
          );
          fileAppendError = true;
        }
      }

      if (fileAppendError) {
        console.error(
          `[Analysis Reporter] ERROR occurred during file appending process for "${test.title}". Request might be incomplete or fail.`
        );
      }
      console.log(
        `[Analysis Reporter] Finished preparing FormData for "${test.title}". File append errors: ${fileAppendError}`
      );
    } catch (formDataError: any) {
      console.error(
        `[Analysis Reporter] CRITICAL ERROR during FormData population for "${test.title}": ${formDataError.message}`,
        formDataError.stack
      );
      return; // Don't proceed if setup failed
    }

    // --- Send Data (Keep axios call with timeout and detailed catch) ---
    try {
      console.log(
        `[Analysis Reporter] Attempting axios.post (NO TRACE/VIDEO) for "${test.title}" to ${this.analysisServerUrl}...`
      );
      const response = await axios.post(this.analysisServerUrl, formData, {
        headers: formData.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 300000, // 5 minutes
      });
      console.log(
        `[Analysis Reporter] axios.post successful for "${test.title}"`
      );
      console.log(
        `[Analysis Reporter] Server Response Status: ${response.status} ${response.statusText}`
      );
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        /* ... detailed Axios error logging ... */
        console.error(`  Axios Error Message: ${error.message}`);
        console.error(`  Error Code: ${error.code}`);
        console.error(`  Target URL: ${error.config?.url}`);
        console.error(`  Request Config Timeout: ${error.config?.timeout}`);
        if (error.response) {
          console.error(`  Response Status: ${error.response.status}`);
          console.error(
            `  Response Data:`,
            JSON.stringify(error.response.data)
          );
        } else if (error.request) {
          console.error("  Request was made, but no response received.");
        } else {
          console.error("  Error setting up the request:", error.message);
        }
        // Specific codes
        if (
          error.code === "ECONNABORTED" ||
          error.message.toLowerCase().includes("timeout")
        ) {
          console.error(`  >>> Diagnosis: CLIENT-SIDE TIMEOUT...`);
        } else if (error.code === "ECONNREFUSED") {
          console.error(`  >>> Diagnosis: CONNECTION REFUSED...`);
        } else if (error.code === "ENOTFOUND") {
          console.error(`  >>> Diagnosis: DNS/Hostname lookup issue...`);
        } else if (
          error.code === "EPIPE" ||
          error.message.includes("socket hang up")
        ) {
          console.error(`  >>> Diagnosis: BROKEN PIPE or SOCKET HANG UP...`);
        } else {
          console.error(
            `  >>> Diagnosis: Other network or request setup error.`
          );
        }
      } else {
        console.error(`  Non-Axios Error Type: ${error.name}`);
        console.error(`  Non-Axios Error Message: ${error.message}`);
        console.error(`  Error Stack: ${error.stack}`);
      }
    } finally {
      console.log(
        `[Analysis Reporter] sendAnalysisData processing finished for "${test.title}".`
      );
    }
  }
}

export default AnalysisReporter;
