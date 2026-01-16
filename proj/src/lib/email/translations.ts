export type EmailLang = string;

export type EmailStrings = {
  appName: string;
  verifySubject: string;
  resetSubject: string;
  receiptSubject: string;
  grantSubject: string;
  contactReplySubject: string;
  contactReplyIntro: string;
  greeting: (name?: string) => string;
  verifyIntro: string;
  resetIntro: string;
  receiptIntro: string;
  grantIntro: string;
  buttonVerify: string;
  buttonReset: string;
  buttonOpen: string;
  footerNote: string;
};

const EN: EmailStrings = {
  appName: 'Jarnazi AI Consensus',
  verifySubject: 'Verify your email',
  resetSubject: 'Reset your password',
  receiptSubject: 'Your token purchase receipt',
  grantSubject: 'You received tokens',
  contactReplySubject: 'Reply from support',
  contactReplyIntro: 'We replied to your message. You can read the response below.',
  greeting: (name) => (name ? `Hi ${name},` : 'Hi,'),
  verifyIntro: 'Please verify your email to activate your account.',
  resetIntro: 'Use the button below to reset your password.',
  receiptIntro: 'Thank you for your purchase. Here is your receipt.',
  grantIntro: 'An admin granted you tokens. Your balance was updated.',
  buttonVerify: 'Verify email',
  buttonReset: 'Reset password',
  buttonOpen: 'Open',
  footerNote: 'If you did not request this, you can safely ignore this email.'
};

const AR: EmailStrings = {
  appName: 'Jarnazi AI Consensus',
  verifySubject: 'تأكيد البريد الإلكتروني',
  resetSubject: 'إعادة تعيين كلمة المرور',
  receiptSubject: 'إيصال شراء التوكنات',
  grantSubject: 'تمت إضافة توكنات إلى حسابك',
  contactReplySubject: 'رد من الدعم',
  contactReplyIntro: 'قمنا بالرد على رسالتك. يمكنك قراءة الرد بالأسفل.',
  greeting: (name) => (name ? `مرحباً ${name}،` : 'مرحباً،'),
  verifyIntro: 'يرجى تأكيد بريدك الإلكتروني لتفعيل حسابك.',
  resetIntro: 'استخدم الزر بالأسفل لإعادة تعيين كلمة المرور.',
  receiptIntro: 'شكراً لشرائك. هذا هو الإيصال الخاص بك.',
  grantIntro: 'قام الأدمن بإضافة توكنات إلى حسابك وتم تحديث الرصيد.',
  buttonVerify: 'تأكيد البريد',
  buttonReset: 'إعادة التعيين',
  buttonOpen: 'فتح',
  footerNote: 'إذا لم تطلب هذا الإجراء، يمكنك تجاهل هذا البريد بأمان.'
};

export function getEmailStrings(lang?: string): EmailStrings {
  const key = (lang || 'en').toLowerCase();
  if (key.startsWith('ar')) return AR;
  return EN;
}
