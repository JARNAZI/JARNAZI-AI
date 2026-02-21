import { test, expect } from '@playwright/test';

test.describe('Smoke Navigation', () => {
    test('should load the homepage', async ({ page }) => {
        await page.goto('/');
        // Check if site name exists (it's in the dict, but we can check for a common element)
        await expect(page).toHaveTitle(/Jarnazi/i);
    });

    test('should navigate to login page', async ({ page }) => {
        await page.goto('/en/login');
        await expect(page.getByRole('heading', { name: /Welcome Back/i })).toBeVisible();
    });

    test('should navigate to register page', async ({ page }) => {
        await page.goto('/en/register');
        await expect(page.getByRole('heading', { name: /Join the Council/i })).toBeVisible();
    });

    test('should navigate to buy tokens page', async ({ page }) => {
        await page.goto('/en/buy-tokens');
        // It should redirect to login if not authenticated, but we want to check the route exists
        const url = page.url();
        expect(url).toContain('/login');
    });
});
