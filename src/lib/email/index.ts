import { Resend } from 'resend';
import {
  renderAdminGrantEmail,
  renderContactReplyEmail,
  renderReceiptEmail,
  renderResetEmail,
  renderVerificationEmail,
} from './templates';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function getResend() {
  const key = requireEnv('RESEND_API_KEY');
  return new Resend(key);
}

function fromVerification() {
  return process.env.RESEND_FROM_VERIFICATION || 'noreply@jarnazi.net';
}

function fromBilling() {
  return process.env.RESEND_FROM_BILLING || 'billing@jarnazi.net';
}

// ===== Allowed email types (no marketing / no notifications) =====

export async function sendVerificationEmailLink(to: string, actionLink: string, lang?: string) {
  const resend = getResend();
  const { subject, html } = renderVerificationEmail({ to, url: actionLink, lang });
  await resend.emails.send({ from: fromVerification(), to, subject, html });
}

export async function sendPasswordResetEmailLink(to: string, actionLink: string, lang?: string) {
  const resend = getResend();
  const { subject, html } = renderResetEmail({ to, url: actionLink, lang });
  await resend.emails.send({ from: fromVerification(), to, subject, html });
}

export async function sendTokenPurchaseInvoice(to: string, amount: string, tokens: number, lang?: string, invoiceId?: string) {
  const resend = getResend();
  const { subject, html } = renderReceiptEmail({ to, amount, tokens, lang, invoiceId });
  await resend.emails.send({ from: fromBilling(), to, subject, html });
}

export async function sendAdminTokenGrant(to: string, tokens: number, reason?: string, lang?: string) {
  const resend = getResend();
  const { subject, html } = renderAdminGrantEmail({ to, tokens, reason, lang });
  await resend.emails.send({ from: fromBilling(), to, subject, html });
}

// Contact support replies
export async function sendContactReply(
  to: string,
  opts: { name?: string; subject?: string; originalMessage?: string; replyText: string; lang?: string }
) {
  const resend = getResend();
  const { subject, html } = renderContactReplyEmail({ to, ...opts });
  await resend.emails.send({ from: fromVerification(), to, subject, html });
}

// Admin alert emails (best-effort; missing env will just skip)
export async function sendAdminAlert(subject: string, message: string) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.RESEND_ADMIN_ALERT_TO || process.env.RESEND_SUPPORT_TO || 'support@jarnazi.net';
  const from = process.env.RESEND_FROM_VERIFICATION || 'noreply@jarnazi.net';
  if (!key) return; // do not crash the app if not configured
  const resend = new Resend(key);
  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;white-space:pre-wrap;">${message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')}</div>`;
  await resend.emails.send({ from, to, subject, html });
}
