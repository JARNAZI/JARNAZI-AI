import { test, expect } from '@playwright/test';

test.describe('Session Persistence', () => {
    test('should persist session when navigating back from external payment', async ({ page }) => {
        // 1. Mock logged in state
        await page.addInitScript(() => {
            window.localStorage.setItem('sb-token-example', JSON.stringify({ access_token: 'fake', user: { id: '123' } }));
        });

        // Mock the session check in Supabase client
        await page.route('**/auth/v1/session*', async route => {
            await route.fulfill({ json: { session: { access_token: 'fake', user: { id: '123' } } } });
        });
        await page.route('**/auth/v1/user*', async route => {
            await route.fulfill({ json: { id: '123', email: 'test@example.com' } });
        });

        await page.goto('/en/debate');

        // We expect to be on the debate page
        await expect(page).toHaveURL(/\/en\/debate/);

        // 2. Navigate to Buy Tokens
        await page.goto('/en/buy-tokens');
        await expect(page).toHaveURL(/\/en\/buy-tokens/);

        // 3. Simulate "going to external gateway" by navigating away
        await page.goto('https://example.com/payment-gateway');

        // 4. Go back
        await page.goBack();

        // 5. Assert we are still authenticated and not redirected to login
        // Note: In real Playwright, goBack() might reload the page.
        // If the session is kept in cookies/localStorage (which we mocked), it should stay.
        await expect(page).toHaveURL(/\/en\/buy-tokens/);

        // Check that we are NOT on the login page
        expect(page.url()).not.toContain('/login');
    });
});
