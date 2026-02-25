import { getEmailStrings } from './translations';

function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function baseLayout(opts: {
  lang?: string;
  title: string;
  intro: string;
  buttonText: string;
  buttonUrl: string;
  footerNote?: string;
  extraHtml?: string;
}) {
  const t = getEmailStrings(opts.lang);
  const appName = t.appName;
  const direction = (opts.lang || '').toLowerCase().startsWith('ar') ? 'rtl' : 'ltr';

  // Use absolute URL for logo - fallback to jarnazi.com
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://jarnazi.com').replace(/\/$/, '');
  const logoUrl = `${baseUrl}/logo.png`;

  const title = escapeHtml(opts.title);
  const intro = escapeHtml(opts.intro);
  const buttonText = escapeHtml(opts.buttonText);
  const buttonUrl = escapeHtml(opts.buttonUrl);
  const footer = escapeHtml(opts.footerNote || t.footerNote);

  return `
  <div style="background:#0b0f19;margin:0;padding:0;font-family:'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#e5e7eb;">
    <div style="max-width:560px;margin:0 auto;padding:40px 18px;">
      <!-- Premium Container -->
      <div style="background:#111827;border:1px solid rgba(255,255,255,0.08);border-radius:24px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.3);">
        
        <!-- Premium Header with Logo -->
        <div style="padding:32px 24px;text-align:center;background:linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%);border-bottom:1px solid rgba(255,255,255,0.08);">
          <a href="${baseUrl}" style="text-decoration:none;display:inline-block;">
            <img src="${logoUrl}" alt="${escapeHtml(appName)}" style="width:64px;height:auto;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;border-radius:12px;" />
            <div style="font-size:18px;font-weight:800;color:#ffffff;letter-spacing:1px;text-transform:uppercase;">${escapeHtml(appName)}</div>
          </a>
        </div>

        <div dir="${direction}" style="padding:32px 24px;">
          <div style="font-size:24px;font-weight:800;margin:0 0 16px;color:#ffffff;letter-spacing:-0.02em;">${title}</div>
          <div style="font-size:15px;line-height:1.7;color:#94a3b8;margin:0 0 24px;">${intro}</div>

          <!-- CTA Button -->
          <div style="margin:24px 0 32px;">
            <a href="${buttonUrl}" style="display:inline-block;background:#06b6d4;color:#001016;text-decoration:none;font-weight:700;font-size:15px;border-radius:12px;padding:14px 24px;box-shadow:0 4px 12px rgba(6,182,212,0.2);">${buttonText}</a>
          </div>

          <!-- Fallback Link -->
          <div style="padding:20px;background:rgba(255,255,255,0.03);border-radius:16px;border:1px solid rgba(255,255,255,0.06);">
            <div style="font-size:12px;font-weight:600;color:#64748b;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em;">${escapeHtml('Direct Link')}</div>
            <div style="font-size:12px;line-height:1.5;color:#06b6d4;word-break:break-all;">
              <a href="${buttonUrl}" style="color:#06b6d4;text-decoration:none;">${buttonUrl}</a>
            </div>
          </div>

          ${opts.extraHtml || ''}

          <div style="margin-top:32px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;line-height:1.6;color:#475569;">${footer}</div>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="text-align:center;padding:24px 0;">
        <div style="color:#475569;font-size:12px;font-weight:600;letter-spacing:0.02em;">© ${new Date().getFullYear()} ${escapeHtml(appName)}</div>
        <div style="color:#334155;font-size:11px;margin-top:4px;">Distributed Multi-Agent Intelligence System</div>
      </div>
    </div>
  </div>`;
}

export function renderVerificationEmail(opts: { to: string; url: string; lang?: string; name?: string }) {
  const t = getEmailStrings(opts.lang);
  return {
    subject: t.verifySubject,
    html: baseLayout({
      lang: opts.lang,
      title: t.verifySubject,
      intro: t.verifyIntro,
      buttonText: t.buttonVerify,
      buttonUrl: opts.url,
    }),
  };
}

export function renderResetEmail(opts: { to: string; url: string; lang?: string; name?: string }) {
  const t = getEmailStrings(opts.lang);
  return {
    subject: t.resetSubject,
    html: baseLayout({
      lang: opts.lang,
      title: t.resetSubject,
      intro: t.resetIntro,
      buttonText: t.buttonReset,
      buttonUrl: opts.url,
    }),
  };
}

export function renderReceiptEmail(opts: {
  to: string;
  amount: string;
  tokens: number;
  lang?: string;
  invoiceId?: string;
}) {
  const t = getEmailStrings(opts.lang);
  const extra = `
    <div style="margin-top:18px;padding:14px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);">
      <div style="font-size:13px;color:#e5e7eb;font-weight:700;margin-bottom:8px;">Receipt</div>
      <div style="font-size:13px;color:#cbd5e1;line-height:1.8;">
        <div><strong>Amount:</strong> ${escapeHtml(opts.amount)}</div>
        <div><strong>Tokens added:</strong> ${escapeHtml(String(opts.tokens))}</div>
        ${opts.invoiceId ? `<div><strong>Invoice:</strong> ${escapeHtml(opts.invoiceId)}</div>` : ''}
      </div>
    </div>`;

  return {
    subject: t.receiptSubject,
    html: baseLayout({
      lang: opts.lang,
      title: t.receiptSubject,
      intro: t.receiptIntro,
      buttonText: t.buttonOpen,
      buttonUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://jarnazi.com',
      extraHtml: extra,
    }),
  };
}

export function renderAdminGrantEmail(opts: {
  to: string;
  tokens: number;
  reason?: string;
  lang?: string;
}) {
  const t = getEmailStrings(opts.lang);
  const extra = `
    <div style="margin-top:18px;padding:14px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);">
      <div style="font-size:13px;color:#e5e7eb;font-weight:700;margin-bottom:8px;">Tokens granted</div>
      <div style="font-size:13px;color:#cbd5e1;line-height:1.8;">
        <div><strong>Tokens:</strong> ${escapeHtml(String(opts.tokens))}</div>
        ${opts.reason ? `<div><strong>Reason:</strong> ${escapeHtml(opts.reason)}</div>` : ''}
      </div>
    </div>`;

  return {
    subject: t.grantSubject,
    html: baseLayout({
      lang: opts.lang,
      title: t.grantSubject,
      intro: t.grantIntro,
      buttonText: t.buttonOpen,
      buttonUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://jarnazi.com',
      extraHtml: extra,
    }),
  };
}

export function renderContactReplyEmail(opts: {
  to: string;
  name?: string;
  subject?: string;
  originalMessage?: string;
  replyText: string;
  lang?: string;
}) {
  const t = getEmailStrings(opts.lang);
  const direction = (opts.lang || '').toLowerCase().startsWith('ar') ? 'rtl' : 'ltr';

  const extra = `
    <div dir="${direction}" style="margin-top:18px;padding:14px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);">
      ${opts.subject ? `<div style=\"font-size:13px;color:#e5e7eb;font-weight:700;margin-bottom:8px;\">${escapeHtml(opts.subject)}</div>` : ''}
      ${opts.originalMessage ? `<div style=\"font-size:12px;color:#94a3b8;line-height:1.7;margin-bottom:10px;\">${escapeHtml(opts.originalMessage)}</div>` : ''}
      <div style="font-size:13px;color:#cbd5e1;line-height:1.8;white-space:pre-wrap;">${escapeHtml(opts.replyText)}</div>
    </div>`;

  return {
    subject: t.contactReplySubject,
    html: baseLayout({
      lang: opts.lang,
      title: t.contactReplySubject,
      intro: t.contactReplyIntro,
      buttonText: t.buttonOpen,
      buttonUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://jarnazi.com',
      extraHtml: extra,
    }),
  };
}
