import { test, expect } from '@playwright/test';

test.describe('i18n Regressions', () => {
    const languages = ['ar', 'fr', 'es', 'de'];

    for (const lang of languages) {
        test(`should not have leaked English text on /${lang}/debate`, async ({ page }) => {
            await page.goto(`/${lang}/debate`);

            // In CI (no real auth), the user is redirected to the login page for that lang
            if (page.url().includes('/login')) {
                // Check the login page does NOT show raw English-only strings
                // (these would only appear if i18n is completely broken — dict has no translation)
                const forbiddenWords = ['Welcome Back', 'Sign in to orchestrate'];
                const body = await page.locator('body').textContent() ?? '';
                for (const word of forbiddenWords) {
                    expect(body, `Found English word "${word}" on /${lang}/login`).not.toContain(word);
                }
            } else {
                // If somehow the user is on /debate, check for leaked English UI strings
                const forbiddenWords = ['Admin Dashboard', 'Privileged Access Only', 'System Access', 'Command Console'];
                const body = await page.locator('body').textContent() ?? '';
                for (const word of forbiddenWords) {
                    expect(body, `Found English word "${word}" on /${lang}/debate`).not.toContain(word);
                }
            }
        });
    }

    test('switching language from EN to AR should update headline', async ({ page }) => {
        await page.goto('/en');
        // Wait for h1 to be present
        await page.waitForSelector('h1', { timeout: 10000 });
        const enTitle = await page.innerText('h1');

        await page.goto('/ar');
        await page.waitForSelector('h1', { timeout: 10000 });
        const arTitle = await page.innerText('h1');

        expect(enTitle).not.toBe(arTitle);
        expect(arTitle).toContain('إجماع'); // "Consensus" in Arabic
    });
});
