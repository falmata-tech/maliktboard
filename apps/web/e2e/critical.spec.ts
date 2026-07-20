import { expect, test, type Page } from "@playwright/test";

async function login(page: Page, identifier: string, password: string) {
  await page.goto("/login");
  await page.locator('[name="identifier"]').fill(identifier);
  await page.locator('[name="password"]').fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test("public request and tracking Server Actions work in a browser", async ({ page }) => {
  const encodingWarnings: string[] = [];
  page.on("console", (message) => {
    if (/encType|encoding type/i.test(message.text())) encodingWarnings.push(message.text());
  });
  await page.goto("/c/bluenile");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Every package");
  await page.getByRole("link", { name: /Request a shipment/i }).first().click();
  await page.locator('[name="senderName"]').fill("Browser Test Sender");
  await page.locator('[name="senderPhone"]').fill("+251900100001");
  await page.locator('[name="receiverName"]').fill("Browser Test Receiver");
  await page.locator('[name="receiverPhone"]').fill("+251900100002");
  await page.locator('[name="originLocationId"]').selectOption("loc_bole");
  await page.locator('[name="destinationLocationId"]').selectOption("loc_hawassa_store");
  await page.locator('[name="contents"]').fill("Synthetic browser-test parcel");
  await page.locator('textarea[name="description"]').fill("Non-sensitive automated browser test");
  await page.locator('[name="photo"]').setInputFiles({
    name: "test-package.png",
    mimeType: "image/png",
    buffer: Buffer.from("89504e470d0a1a0a", "hex"),
  });
  await page.getByRole("button", { name: /Submit/i }).click();
  await expect(page).toHaveURL(/\/q\//);
  await expect(page.getByText(/Request submitted/i)).toBeVisible();

  await page.goto("/track");
  await page.locator('[name="trackingNumber"]').fill("MB-104829");
  await page.locator('[name="phone"]').fill("+251911300400");
  await page.getByRole("button", { name: "Open tracking" }).click();
  await expect(page).toHaveURL(/\/t\/demo-track-blue-nile$/);
  await expect(page.getByRole("heading", { name: "MB-104829" })).toBeVisible();
  expect(encodingWarnings).toEqual([]);
});

test("public tracking keeps authorization secrets private", async ({ page }) => {
  await page.goto("/t/demo-track-blue-nile");
  await expect(page.getByText("482913")).toHaveCount(0);
  await expect(page.getByText("+251911300400")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("demo-owner-blue-nile");
  await expect(page.getByText(/Delivery PIN, government ID photographs/)).toBeVisible();
});

test("owner login and scanner resolution work through real browser actions", async ({ page }) => {
  await login(page, "owner@bluenile.local", "Owner123!");
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("heading", { name: "Keep the network moving" })).toBeVisible();
  await page.goto("/mobile");
  await page.locator('input[placeholder="Scan or enter identifier"]').fill("demo-shipment-qr");
  const resolution = page.waitForResponse((response) => response.url().endsWith("/api/scan/resolve"));
  await page.getByRole("button", { name: "Resolve" }).click();
  await expect((await resolution).ok()).toBeTruthy();
  await expect(page.getByText("MB-104829")).toBeVisible();
  await expect(page.getByText("SHIPMENT", { exact: true })).toBeVisible();
});

test("role destinations and privileged-page redirects are enforced", async ({ browser }) => {
  const cases = [
    { login: "team@bluenile.local", password: "Team123!", forbidden: "/app/settings" },
    { login: "viewer@bluenile.local", password: "Viewer123!", forbidden: "/app/team" },
  ];
  for (const item of cases) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, item.login, item.password);
    await expect(page).toHaveURL(/\/app$/);
    await page.goto(item.forbidden);
    await expect(page).toHaveURL(/\/app$/);
    await context.close();
  }

  const customerContext = await browser.newContext();
  const customerPage = await customerContext.newPage();
  await login(customerPage, "customer@example.com", "Customer123!");
  await expect(customerPage).toHaveURL(/\/portal$/);
  await expect(customerPage.getByRole("heading", { name: "Amina Mohammed" })).toBeVisible();
  await customerContext.close();

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await login(adminPage, "admin@maliktboard.local", "Admin123!");
  await expect(adminPage).toHaveURL(/\/admin$/);
  await expect(adminPage.getByText("Platform administration")).toBeVisible();
  await adminContext.close();
});
