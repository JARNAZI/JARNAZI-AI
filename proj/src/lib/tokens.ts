/**
 * Token pricing rules (Phase 3)
 *
 * - User buys an amount in USD/USDT (min $14)
 * - Tokens = amount * 3
 * - Token balance is stored as INTEGER TOKENS.
 *
 * Note: The DB schema provided by the user uses `profiles.token_balance_cents`.
 * We treat it as token balance (tokens) to keep migrations minimal.
 */

export const MIN_PURCHASE_AMOUNT_USD = 14;
export const TOKENS_PER_USD = 3;

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
  // Must be an exact multiple of $1 to avoid leftovers.
  const cents = Math.round(amountUsd * 100);
  return cents % 100 === 0;
}

export function amountToTokens(amountUsd: number): number {
  // amount is validated to be multiple of $1, so integer tokens result.
  return Math.round(amountUsd) * TOKENS_PER_USD;
}
