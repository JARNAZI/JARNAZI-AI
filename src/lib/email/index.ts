import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import {
  renderAdminGrantEmail,
  renderContactReplyEmail,
  renderReceiptEmail,
  renderResetEmail,
  renderVerificationEmail,
} from './templates';

import { getSetting } from '../settings';

// Initialize Resend SDK (Module level fallback)
const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.RESEND_API_KEY_LIVE;
const DEFAULT_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'system@jarnazi.com';

async function getEmailConfig() {
  // Only the sender address can be overridden from the DB for flexibility,
  // the API key MUST come from Environment Variables for security as requested.
  const from = await getSetting<string>('email_from_address', DEFAULT_FROM_EMAIL);

  return {
    apiKey: RESEND_API_KEY,
    from,
    resend: RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null
  };
}

function getSupabaseAdmin() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key);
}

/**
 * Sends an email using the Resend SDK directly from the Next.js server.
 * This is the preferred method as it provides better error visibility.
 */
async function callEmailFunction(payload: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}) {
  const { apiKey, from, resend } = await getEmailConfig();
  console.log(`[Email Service] Attempting to send email to: ${payload.to} via ${from}`);

  // Inject the dynamically determined 'from' address into the payload for the Edge Function fallback
  const enrichedPayload = { ...payload, from: payload.from || from };

  // METHOD 1: Direct Resend SDK (Primary)
  if (resend) {
    try {
      console.log(`[Email Service] Using Resend SDK directly...`);
      const { data, error } = await resend.emails.send({
        from: from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      });

      if (error) {
        console.error('[Email Service] Resend SDK Error:', error);
        // Fall through to Method 2 if SDK fails
      } else {
        console.log('[Email Service] Success via Resend SDK:', data?.id);
        return data;
      }
    } catch (err: any) {
      console.error('[Email Service] Exception in Resend SDK:', err.message);
      // Fall through to Method 2
    }
  } else {
    console.warn('[Email Service] Resend configuration (API Key) missing in Environment. Skipping direct SDK method.');
  }

  // METHOD 2: Supabase Edge Function (Fallback)
  console.log(`[Email Service] Attempting fallback via Supabase Edge Function...`);
  const supabase = getSupabaseAdmin();
  const secret = process.env.EMAIL_FUNCTION_SECRET;

  if (!supabase) {
    const msg = '[Email Service] CRITICAL: Both direct SDK and Supabase Edge Function are unavailable. (Check environment variables)';
    console.error(msg);
    throw new Error(msg);
  }

  try {
    console.log(`[Email Service] Invoking 'send-email' edge function...`);
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: enrichedPayload,
      headers: secret ? { 'x-email-secret': secret } : {},
    });

    if (error) {
      let errorMessage = 'Edge Function returned an error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Handle Supabase specific error structure if possible
        errorMessage = (error as any).message || JSON.stringify(error);
      }

      console.error(`[Email Service] Edge Function Execution Failed:`, errorMessage);
      throw new Error(`Email Edge Function Error: ${errorMessage}`);
    }

    console.log('[Email Service] Successfully dispatched via Edge Function');
    return data;
  } catch (err: any) {
    console.error('[Email Service] Final Dispatch Error:', err.message);
    throw err;
  }
}


// ===== Email Dispatchers =====

export async function sendVerificationEmailLink(to: string, actionLink: string, lang?: string) {
  const { subject, html } = renderVerificationEmail({ to, url: actionLink, lang });
  return callEmailFunction({ to, subject, html });
}

export async function sendPasswordResetEmailLink(to: string, actionLink: string, lang?: string) {
  const { subject, html } = renderResetEmail({ to, url: actionLink, lang });
  return callEmailFunction({ to, subject, html });
}

export async function sendTokenPurchaseInvoice(to: string, amount: string, tokens: number, lang?: string, invoiceId?: string) {
  const { subject, html } = renderReceiptEmail({ to, amount, tokens, lang, invoiceId });
  return callEmailFunction({ to, subject, html });
}

export async function sendAdminTokenGrant(to: string, tokens: number, reason?: string, lang?: string) {
  const { subject, html } = renderAdminGrantEmail({ to, tokens, reason, lang });
  return callEmailFunction({ to, subject, html });
}

export async function sendContactReply(
  to: string,
  opts: { name?: string; subject?: string; originalMessage?: string; replyText: string; lang?: string }
) {
  const { subject, html } = renderContactReplyEmail({ to, ...opts });
  return callEmailFunction({ to, subject, html });
}

export async function sendAdminAlert(subject: string, message: string) {
  const to = process.env.RESEND_ADMIN_ALERT_TO || process.env.RESEND_SUPPORT_TO || 'support@jarnazi.com';
  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;white-space:pre-wrap;">${message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')}</div>`;

  return callEmailFunction({ to, subject, html });
}


