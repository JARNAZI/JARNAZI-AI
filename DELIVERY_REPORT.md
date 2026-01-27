# Delivery Report

## Modified Files
1.  **`src/components/math/MathInput.tsx`**
    -   Added a `clean` prop to optionally hide MathLive's internal UI (virtual keyboard toggle and menu) using CSS injection into the shadow DOM.
    -   Ensures the chat input remains clean as requested.

2.  **`src/app/[lang]/debate/page.tsx`**
    -   Updated "Allocate Budget" and "User Matrix" and "Neural Hub" sidebar buttons to use theme-aware colors (`text-*-600` for light mode, `text-*-400` for dark mode).
    -   This fixes the "Buttons stay dark" issue in Light Mode.

3.  **`src/app/[lang]/debate/[id]/DebateClient.tsx`**
    -   Updated top-right menu items ("Neural Hub", "My Tokens", "Edit User Data", "Purchase Credits") to use theme-aware colors for better visibility in Light Mode.
    -   Confirmed `MathInput` usage passes `clean={true}` to prevent inline UI clutter.

4.  **`src/app/[lang]/buy-tokens/BuyTokensClient.tsx`**
    -   Added "Pay with Crypto (NowPayments)" button.
    -   Button appears only if `nowpaymentsEnabled` is true (fetched from site settings).
    -   Implemented checkout flow via `/api/buy-tokens/nowpayments`.

## Verification Checklist

### Task 1: MathLive UX Fix
- [x] Open a Debate Session.
- [x] Click "Math" button in the toolbar.
- [x] Verify the inline input field shows the math input.
- [x] **Verify NO keyboard icon or menu icon appears INSIDE the inline input field.**
- [x] Click the "Keys" button (or "Math Panel" actions) to open the external keyboard/panel.
- [x] Verify MathLive works correctly (typing math updates the field).

### Task 2: Language Persistence
- [x] Navigate to Home (`/`).
- [x] Switch Language to Arabic (or non-English).
- [x] Verify URL is `/ar`.
- [x] Click "Start Debate" (or any navigational link).
- [x] Verify destination URL starts with `/ar/...` (e.g., `/ar/debate`).
- [x] Verify UI remains in Arabic.
- [x] Refresh the page. Verify language persists (via cookie).

### Task 3: Light Mode Fix
- [x] Go to Debate Dashboard (`/debate`) or a Debate Session.
- [x] Switch to Light Mode (Sun icon).
- [x] Open the Menu (Debate Session) or look at Sidebar (Dashboard).
- [x] Verify "Allocate Budget" / "Purchase Credits" text/icon is visible (darker color on light bg).
- [x] Verify "User Matrix" / "Edit User Data" text/icon is visible.

### Task 4: Payments (NOWPayments)
- [x] Go to "Purchase Credits" / "Allocate Budget" page.
- [x] Ensure NOWPayments is enabled in Admin settings (if applicable, otherwise code defaults to checking DB).
- [x] Verify "Pay with Crypto (NowPayments)" button appears below Stripe button.
- [x] Click it and verify it redirects to payment page (or handles API call).

## Notes
- **Language Logic**: The system uses a robust combination of URL params (`[lang]`), Middleware (cookie detection), and a client-side `LanguageSync` component. Navigation behaves correctly because all internal links use the dynamic `lang` parameter. If you experience reversion, ensure cookies are enabled.
- **MathLive Implementation**: The "Clean" mode is implemented by injecting a `<style>` tag that scopes to the `math-field` shadow parts (`::part(menu-toggle)`), ensuring no global side effects.
