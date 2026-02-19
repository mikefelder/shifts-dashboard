import { test, expect } from '@playwright/test';

test('basic test', async ({ page }) => {
  await page.goto('/');
  // This is just a placeholder test for T003 acceptance criteria
  // Real tests will be added in later phases
  await expect(page).toHaveTitle(/Shifts Dashboard/);
});
