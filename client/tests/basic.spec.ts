import { test, expect } from "@playwright/test";

test("basic test", async ({ page }) => {
  await page.goto("http://localhost:3000");
  const title = await page.title();
  expect(title).toBe("ToBeChanged");


// LLM suggested fix
/Users/gregduckworth/Github/startup-signup/client/tests/basic.spec.ts
});
