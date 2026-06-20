import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 375, height: 812 }, isMobile: true });

test('capture new UI/UX highlights', async ({ page }) => {
  // 1. Dashboard / Stats
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(2000); // Wait for animations
  await page.screenshot({ path: 'test-results/dashboard_godmode.png' });

  // 2. Navigation & Mode Selector
  await page.goto('http://localhost:5173/catch');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/catch_mode_selector.png' });

  // 3. Select CNVR Mode and see form
  await page.click('text=CNVR Programme');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/catch_form_cnvr.png' });

  // 4. Registry
  await page.goto('http://localhost:5173/dogs');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-results/registry_editorial.png' });

  // 5. Identify
  await page.goto('http://localhost:5173/identify');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/identify_radar.png' });
});
