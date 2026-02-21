import { test, expect } from '@playwright/test';

test.describe('i18n Regressions', () => {
    const languages = ['ar', 'fr', 'es', 'de'];

    for (const lang of languages) {
        test(`should not have leaked English text on /${lang}/debate`, async ({ page }) => {
            await page.goto(`/${lang}/debate`);

            // We expect the user to be redirected to login if not logged in
            // So we should check the login page for that lang
            if (page.url().includes('/login')) {
                const forbiddenWords = ['Welcome Back', 'Sign in to orchestrate'];
                for (const word of forbiddenWords) {
                    await expect(page.locator('body')).not.toContainText(word);
                }
            } else {
                // Known problematic words on /debate
                const forbiddenWords = ['Admin Dashboard', 'Privileged Access Only', 'System Access', 'Command Console'];
                for (const word of forbiddenWords) {
                    await expect(page.locator('body')).not.toContainText(word);
                }
            }
        });
    }

    test('switching language from EN to AR should update headline', async ({ page }) => {
        await page.goto('/en');
        const enTitle = await page.innerText('h1');

        // Find language switcher - in this app it seems to be in a menu or footer
        // Let's try navigating directly for now to verify the dictionary works
        await page.goto('/ar');
        const arTitle = await page.innerText('h1');

        expect(enTitle).not.toBe(arTitle);
        expect(arTitle).toContain('إجماع'); // "Consensus" in Arabic
    });
});
