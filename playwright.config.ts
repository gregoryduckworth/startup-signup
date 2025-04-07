import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "client/tests",
  use: {
    browserName: "chromium",
    headless: true,
  },
  reporter: "dot",
});
