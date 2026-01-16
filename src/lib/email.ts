// Backward-compatible email module.
// IMPORTANT: Only transactional emails are sent (verification, password reset, billing, admin grants).

export {
  sendVerificationEmailLink,
  sendPasswordResetEmailLink,
  sendTokenPurchaseInvoice,
  sendAdminTokenGrant,
} from './email/index';

// No-op stubs for legacy calls (we do NOT send marketing/notification emails).
export async function sendDebateSummary(email?: string, topic?: string, debateId?: string) {
  return { success: true };
}

export async function sendAdminAlert(subject?: string, message?: string) {
  return { success: true };
}

export async function sendContactReply(toEmail?: string, data?: any) {
  return { success: true };
}
