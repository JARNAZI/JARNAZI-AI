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

  const title = escapeHtml(opts.title);
  const intro = escapeHtml(opts.intro);
  const buttonText = escapeHtml(opts.buttonText);
  const buttonUrl = escapeHtml(opts.buttonUrl);
  const footer = escapeHtml(opts.footerNote || t.footerNote);

  return `
  <div style="background:#0b0f19;margin:0;padding:0;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:28px 18px;">
      <div style="background:#111827;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
        <div style="padding:20px 22px;border-bottom:1px solid rgba(255,255,255,0.08);">
          <div style="font-size:16px;font-weight:700;color:#e5e7eb;letter-spacing:0.2px;">${escapeHtml(appName)}</div>
        </div>
        <div dir="${direction}" style="padding:22px;color:#e5e7eb;">
          <div style="font-size:18px;font-weight:700;margin:0 0 10px;">${title}</div>
          <div style="font-size:14px;line-height:1.7;color:#cbd5e1;margin:0 0 18px;">${intro}</div>

          <div style="margin:18px 0 22px;">
            <a href="${buttonUrl}" style="display:inline-block;background:#06b6d4;color:#001016;text-decoration:none;font-weight:700;border-radius:12px;padding:12px 16px;">${buttonText}</a>
          </div>

          <div style="font-size:12px;line-height:1.6;color:#94a3b8;word-break:break-all;">
            <div style="margin-bottom:10px;">${escapeHtml('If the button does not work, open this link:')}</div>
            <div><a href="${buttonUrl}" style="color:#7dd3fc;text-decoration:underline;">${buttonUrl}</a></div>
          </div>

          ${opts.extraHtml || ''}

          <div style="margin-top:22px;font-size:12px;line-height:1.6;color:#94a3b8;">${footer}</div>
        </div>
      </div>
      <div style="text-align:center;color:#64748b;font-size:11px;margin-top:14px;">© ${new Date().getFullYear()} ${escapeHtml(appName)}</div>
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
