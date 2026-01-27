/**
 * Token pricing rules
 *
 * We treat the DB fields `profiles.token_balance_cents` and `token_ledger.change_cents`
 * as **integer tokens** (despite the "cents" name) to avoid heavy migrations.
 *
 * Pricing model:
 * - User enters any amount in USD (min $14.00)
 * - Tokens = floor(amount_usd * TOKENS_PER_USD)
 *
 * Recommended default:
 * - 1 USD = 3 tokens  (=> $14 = 42 tokens)
 *
 * You can safely change TOKENS_PER_USD later; the UI will show the correct token amount
 * for any entered USD amount.
 */

export const MIN_PURCHASE_AMOUNT_USD = 14;
export const TOKENS_PER_USD = 3; // 1 USD = 3 tokens (=> $14 = 42 tokens)

/** Normalize an amount coming from JSON/UI into a number with 2 decimals max. */
export function normalizeAmount(amount: unknown): number | null {
  if (typeof amount === "number" && Number.isFinite(amount)) {
    return Math.round(amount * 100) / 100;
  }
  if (typeof amount === "string") {
    const n = Number(amount.trim());
    if (Number.isFinite(n)) return Math.round(n * 100) / 100;
  }
  return null;
}

export function isValidPurchaseAmount(amountUsd: number): boolean {
  if (!Number.isFinite(amountUsd)) return false;
  if (amountUsd < MIN_PURCHASE_AMOUNT_USD) return false;
  const cents = Math.round(amountUsd * 100);
  // must be >= min and at least $0.01 increments
  return cents >= Math.round(MIN_PURCHASE_AMOUNT_USD * 100) && cents % 1 === 0;
}

export function amountToTokens(amountUsd: number): number {
  const cents = Math.round(amountUsd * 100);
  // tokens per cent = TOKENS_PER_USD / 100
  // Use integer math to avoid float drift:
  return Math.floor((cents * TOKENS_PER_USD) / 100);
}
