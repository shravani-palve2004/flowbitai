import { test, expect } from "@playwright/test";

test("User can draw polygon and area-of-interest updates", async ({ page }) => {
  await page.goto("http://localhost:5173");

  // Wait for map
  const map = page.locator(".leaflet-container");
  await map.waitFor();

  // Click polygon draw button
  await page.getByRole("button", { name: /polygon/i }).click();

  // Get map box for relative clicks
  const box = await map.boundingBox();
  if (!box) throw new Error("Map not found");

  // Click 3 points
  await page.mouse.click(box.x + 200, box.y + 200);
  await page.mouse.click(box.x + 300, box.y + 250);
  await page.mouse.click(box.x + 250, box.y + 300);

  // Double-click to finish polygon
  await page.mouse.dblclick(box.x + 250, box.y + 300);

  // Expect polygon SVG path
  const polygon = page.locator("svg path.leaflet-interactive");
  await expect(polygon.first()).toBeVisible();
});
