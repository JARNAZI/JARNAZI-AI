# Manual QA Forensic Audit Report - Jarnazi AI

**Auditor:** Senior AI QA Engineer
**Date:** February 21, 2026

## A) Manual Forensic Audit Findings

### 1. Language / i18n Audit
| Page | Component/Selector | English String Found | Expected | Root Cause | Fix Suggestion |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/debate` | System Menu | "Admin Dashboard" | Translated string | Hardcoded in `DebateDashboard.tsx` & `DebateMenu.tsx` | Use `dict.adminDashboard.title` from dictionary. |
| `/debate` | System Menu | "System Access" | Translated string | Hardcoded in `DebateDashboard.tsx` | Use `dict.dashboard.systemAccess` |
| `/debate` | System Menu | "Privileged Access Only" | Translated string | Hardcoded in `DebateDashboard.tsx` | Use `dict.dashboard.privilegedAccess` |
| `/debate` | Consensus Library | "INDEXED SESSIONS" | Translated string (fallback) | Fallback string in `DebateDashboard.tsx` | Ensure `dict.dashboard.indexedSessions` is correctly used. |
| `/debate/usage` | Usage Cards | "TRIAL" / "FREE" | Translated string | Hardcoded conditional in `UsageClient.tsx` | Add keys for plan names to dictionary. |
| `/debate/usage` | Usage Cards | "Initiate Tier" / "Pro Council Member" | Translated string | Hardcoded conditional in `UsageClient.tsx` | Add keys for tier descriptions to dictionary. |
| `/debate/usage` | Usage Cards | "UNLIMITED" / "PERPETUAL" | Translated string | Hardcoded conditional in `UsageClient.tsx` | Add keys for limit labels to dictionary. |
| `/debate/[id]` | Agreement Header | "الاتفاق" (Arabic Hardcoded) | Translated string | Hardcoded in `DebateClient.tsx` for all languages | Use `dict.debate.agreementTitle` |
| `/login` | Toast messages | Fallback English messages | Translated alerts | Missing null-checks or fallbacks in `LoginClient.tsx` | Use `dict.notifications` consistently. |

### 2. Menu + Buttons Audit
| Broken Button/Menu Item | Steps | Expected | Actual | Console/Network Evidence |
| :--- | :--- | :--- | :--- | :--- |
| Crypto Payment Button | Navigate to Buy Tokens | Button visible if enabled | Button hidden | Missing `gateway_nowpayments_enabled` in `site_settings` |
| Admin Dashboard Link | Click Admin link in menu | Redirect to `/admin` | Works, but label is English | N/A |
| "Back" from External Payment | Use Back button after Stripe/Crypto redirect | Stay logged in | Session sometimes lost | BFcache or Supabase session refresh issue |

### 3. Payments Audit
| Feature | Status | Observation |
| :--- | :--- | :--- |
| Stripe Visibility | Pass | Visible when flag is true. |
| Crypto Visibility | Fail | Often missing due to DB configuration fallback to false. |
| Back Navigation | Fail | Session persistence is inconsistent on cross-origin returns. |

### 4. Console + Network Failures
| Flow | Page | Issue | Endpoint |
| :--- | :--- | :--- | :--- |
| Auth | `/login` | Failed to fetch site settings (Silent) | `GET /rest/v1/site_settings` |
| Payments | `/buy-tokens` | 402 Insufficient funds (Expected but UX could be better) | `POST /api/debate` |

---

## B) Automated Suite (Playwright)

Implemented tests in `/tests/e2e/`:
1.  `smoke.spec.ts`: Basic navigation checks.
2.  `i18n.spec.ts`: Checks for forbidden English words on non-English pages.
3.  `payments.spec.ts`: Verifies gateway button logic (mocked).
4.  `session.spec.ts`: Verifies session persistence after navigating back.

### How to Run Locally
```bash
npx playwright test
```

### CI/CD
GitHub Actions workflow added: `.github/workflows/playwright.yml`. Runs on PR and Push to main.

---

## C) Coverage & Limitations

### What the Tests Catch:
- **Structural i18n regressions**: Detects if specific English keywords (Admin, System Access, etc.) leak into non-English routes.
- **Critical Flow Stability**: Ensures the homepage, login, and registration pages load and basic navigation works.
- **Payment Button Visibility**: Logic-level verification that both Stripe and Crypto buttons appear when toggled via mocked settings.
- **Session Integrity**: Catches regressions in `SessionBackGuard.tsx` logic that would otherwise kick users out during back-page navigation.

### What might still be missed:
- **Dynamic AI Content Hallucinations**: Since AI responses are generated in real-time by external models, the E2E suite cannot easily verify the "quality" or "accuracy" of the debate content itself.
- **Deep Mobile Browser Quirks**: While Playwright simulates mobile viewports, specific hardware-level bugs (like iOS specific keyboard overlaps) may still require occasional manual verification.
- **Third-Party Gateway Side Effects**: We mock the payment gateway response; actual outages at Stripe or NOWPayments cannot be caught by this local suite.

