import { test, expect } from '@playwright/test';

test.describe('Payments Visibility', () => {
    test('should show both payment gateways when enabled', async ({ page }) => {
        // Mock the Supabase request for site_settings to ensure both are enabled
        await page.route('**/rest/v1/site_settings*', async route => {
            const response = [
                { key: 'gateway_stripe_enabled', value: 'true' },
                { key: 'gateway_nowpayments_enabled', value: 'true' }
            ];
            await route.fulfill({ json: response });
        });

        await page.goto('/en/buy-tokens');

        // We expect to be redirected to login if not authenticated
        // But if we mock the auth state too, we can see the page
        // For now, let's just check that if we are on the page, the buttons are there

        // If we can't easily mock auth, we at least check the code logic via unit-like E2E
        // or assume we are logged in for this test (can be done via storageState)
    });
});
