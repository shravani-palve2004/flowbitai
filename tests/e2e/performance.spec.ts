import { test, expect } from "@playwright/test";

test("Draw rectangle on map", async ({ page }) => {
  await page.goto("http://localhost:5173");

  // Wait for map to load properly
  await page.waitForSelector(".leaflet-container");

  // Enable rectangle drawing mode
  await page.getByRole("button", { name: /draw/i }).click();

  const map = page.locator(".leaflet-container");

  const box = await map.boundingBox();
  if (!box) throw new Error("Map not found");

  // Simulate mouse drag to draw a rectangle
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 100);
  await page.mouse.up();

  // Leaflet.Draw creates an SVG <path> for rectangle
  const rect = page.locator("svg path.leaflet-interactive");

  // Ensure at least one path exists
  await expect(rect.first()).toBeVisible();
});
