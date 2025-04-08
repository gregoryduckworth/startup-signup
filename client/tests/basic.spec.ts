The test is failing because it expects the title of the page to be "ToBeChanged", but the actual title is "InnovateTech". Here's how you can fix it:

```diff
import { test, expect } from "@playwright/test";

test("basic test", async ({ page }) => {
  await page.goto("http://localhost:3000");
  const title = await page.title();
-  expect(title).toBe("ToBeChanged");
+  expect(title).toBe("InnovateTech");
});
```