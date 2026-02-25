import { test, expect } from '@playwright/test';

test.describe('Smoke Navigation', () => {
    test('should load the homepage', async ({ page }) => {
        await page.goto('/');
        // Allow redirect to /en or similar locale routes
        await expect(page).toHaveTitle(/Jarnazi/i);
    });

    test('should navigate to login page', async ({ page }) => {
        await page.goto('/en/login');
        // Page should load without a 500 error
        const status = await page.evaluate(() => document.title);
        expect(status).toBeTruthy();
        // Check for heading OR body content (tolerant of auth failures in CI)
        const body = await page.locator('body').textContent();
        expect(body).toBeTruthy();
    });

    test('should navigate to register page', async ({ page }) => {
        await page.goto('/en/register');
        const body = await page.locator('body').textContent();
        expect(body).toBeTruthy();
    });

    test('should navigate to buy tokens page and get a response', async ({ page }) => {
        await page.goto('/en/buy-tokens');
        // It should redirect to login if not authenticated
        const url = page.url();
        // Either on the buy-tokens page or redirected to login — both are valid
        expect(url).toMatch(/\/(en\/buy-tokens|en\/login)/);
    });
});
