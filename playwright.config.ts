import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "client/tests",
  use: {
    browserName: "chromium",
    headless: true,
    // trace: "retain-on-first-failure",
    // video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  reporter: [["./custom-reporter.ts"]],
});
