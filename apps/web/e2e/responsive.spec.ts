import { expect, test } from "@playwright/test";

test("public experience fits a mobile viewport and exposes keyboard focus", async ({ page }) => {
  await page.goto("/c/bluenile");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).not.toHaveCount(0);
  await page.getByRole("link", { name: "አማርኛ" }).click();
  await expect(page).toHaveURL(/lang=am/);
  await expect(page.getByRole("link", { name: "መላኪያ ይጠይቁ" }).first()).toBeVisible();
});

test("login and scanner layouts fit the mobile viewport", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await page.locator('[name="identifier"]').fill("owner@bluenile.local");
  await page.locator('[name="password"]').fill("Owner123!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.goto("/mobile");
  await expect(page.getByRole("heading", { name: "Scan and update" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
