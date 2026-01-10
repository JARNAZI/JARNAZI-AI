import { createClient } from '@supabase/supabase-js';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jarnazi.com';
const FUNCTION_NAME = 'send-email';

// Helper to invoke Edge Function
async function invokeEmailFunction(type: string, to: string, subject: string, data: any, language: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    const { data: resData, error } = await supabase.functions.invoke(FUNCTION_NAME, {
      body: {
        to: [to],
        subject,
        type,
        data: { ...data, baseUrl: BASE_URL, logoUrl: `${BASE_URL}/logo.png`, brandName: 'Jarnazi AI' },
        lang: language
      }
    });

    if (error) throw error;
    return { success: true, data: resData };
  } catch (error: any) {
    console.error(`Failed to send ${type} email via Edge Function:`, error);
    return { success: false, error: error.message };
  }
}

export async function sendWelcomeEmail(email: string, name: string, language: string = 'en') {
  const actionUrl = `${BASE_URL}/debate`;
  // Using 'notification' type for generic welcome if not explicitly supported, or assume 'notification' handles it.
  // Prompt implied specific types. Let's use 'notification' for welcome as per edge function view which had generic case.
  return invokeEmailFunction('notification', email, 'Welcome to Jarnazi Consensus AI', { message: `Welcome ${name}! We are ready for your debates.`, url: actionUrl }, language);
}

export async function sendVerificationEmail(email: string, token: string, language: string = 'en') {
  const actionUrl = `${BASE_URL}/verify?token=${token}`;
  return invokeEmailFunction('verification', email, 'Verify your Jarnazi account', { url: actionUrl, email }, language);
}

export async function sendPasswordResetEmail(email: string, token: string, language: string = 'en') {
  const actionUrl = `${BASE_URL}/reset-password?token=${token}`;
  return invokeEmailFunction('reset-password', email, 'Reset your password', { url: actionUrl, email }, language);
}

export async function sendDebateSummary(email: string, topic: string, debateId: string, language: string = 'en') {
  const actionUrl = `${BASE_URL}/debate/${debateId}`;
  return invokeEmailFunction('notification', email, `Consensus Reached: ${topic}`, { message: `The debate on "${topic}" has concluded. View the summary.`, url: actionUrl }, language);
}

export async function sendTokenPurchaseInvoice(email: string, planName: string, amount: string, tokens: number, language: string = 'en') {
  const actionUrl = `${BASE_URL}/settings/billing`;
  return invokeEmailFunction('billing', email, 'Your Token Purchase Receipt', { planName, amount, tokens, url: actionUrl }, language);
}

export async function sendAdminTokenGrant(email: string, tokens: number, reason: string, language: string = 'en') {
  const actionUrl = `${BASE_URL}/debate`;
  return invokeEmailFunction('notification', email, 'You received new tokens', { message: `You have been granted ${tokens} tokens. Reason: ${reason}`, url: actionUrl }, language);
}

export async function sendAdminAlert(subject: string, message: string) {
  // Admin alert likely goes to a hardcoded admin email in Edge Function or passed here?
  // Edge Function didn't have specific admin alert type, but 'notification' works.
  // We'll send to the system email if possible or just use notification type.
  const adminEmail = 'admin@jarnazi.com'; // In a real app this might be dynamic
  return invokeEmailFunction('notification', adminEmail, `[ALERT] ${subject}`, { message }, 'en');
}

export async function sendContactReply(email: string, name: string, originalMessage: string, replyMessage: string) {
  return invokeEmailFunction('notification', email, 'Re: Your Inquiry to Jarnazi AI', { message: `Dear ${name},\n\n${replyMessage}` }, 'en');
}


export async function sendVerificationEmailLink(email: string, actionLink: string, language: string = 'en') {
  return invokeEmailFunction('verification', email, 'Verify your Jarnazi account', { url: actionLink, email }, language);
}

export async function sendPasswordResetEmailLink(email: string, actionLink: string, language: string = 'en') {
  return invokeEmailFunction('reset-password', email, 'Reset your password', { url: actionLink, email }, language);
}
