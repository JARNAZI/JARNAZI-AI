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
  buttonReply: string;
  buttonViewTokens: string;
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
  buttonReply: 'Reply to Message',
  buttonViewTokens: 'View Invoice',
  footerNote: 'If you did not request this, you can safely ignore this email.'
};

const ES: EmailStrings = {
  appName: 'Jarnazi AI Consensus',
  verifySubject: 'Verifica tu correo electrónico',
  resetSubject: 'Restablece tu contraseña',
  receiptSubject: 'Tu recibo de compra de tokens',
  grantSubject: 'Has recibido tokens',
  contactReplySubject: 'Respuesta del soporte',
  contactReplyIntro: 'Hemos respondido a tu mensaje. Puedes leer la respuesta a continuación.',
  greeting: (name) => (name ? `Hola ${name},` : 'Hola,'),
  verifyIntro: 'Por favor, verifica tu correo electrónico para activar tu cuenta.',
  resetIntro: 'Usa el botón de abajo para restablecer tu contraseña.',
  receiptIntro: 'Gracias por tu compra. Aquí tienes tu recibo.',
  grantIntro: 'Un administrador te ha otorgado tokens. Tu saldo ha sido actualizado.',
  buttonVerify: 'Verificar correo',
  buttonReset: 'Restablecer contraseña',
  buttonOpen: 'Abrir',
  buttonReply: 'Responder al mensaje',
  buttonViewTokens: 'Ver factura',
  footerNote: 'Si no solicitaste esto, puedes ignorar este correo con seguridad.'
};

const PT: EmailStrings = {
  appName: 'Jarnazi AI Consensus',
  verifySubject: 'Verifique seu e-mail',
  resetSubject: 'Redefina sua senha',
  receiptSubject: 'Seu recibo de compra de tokens',
  grantSubject: 'Você recebeu tokens',
  contactReplySubject: 'Resposta do suporte',
  contactReplyIntro: 'Respondemos à sua mensagem. Você pode ler a resposta abaixo.',
  greeting: (name) => (name ? `Olá ${name},` : 'Olá,'),
  verifyIntro: 'Por favor, verifique seu e-mail para ativar sua conta.',
  resetIntro: 'Use o botão abaixo para redefinir sua senha.',
  receiptIntro: 'Obrigado pela sua compra. Aqui está o seu recibo.',
  grantIntro: 'Um administrador concedeu tokens a você. Seu saldo foi atualizado.',
  buttonVerify: 'Verificar e-mail',
  buttonReset: 'Redefenir senha',
  buttonOpen: 'Abrir',
  buttonReply: 'Responder à mensagem',
  buttonViewTokens: 'Ver fatura',
  footerNote: 'Se você não solicitou isso, pode ignorar este e-mail com segurança.'
};

const DE: EmailStrings = {
  appName: 'Jarnazi AI Consensus',
  verifySubject: 'E-Mail-Adresse bestätigen',
  resetSubject: 'Passwort zurücksetzen',
  receiptSubject: 'Ihr Beleg für den Token-Kauf',
  grantSubject: 'Sie haben Token erhalten',
  contactReplySubject: 'Antwort vom Support',
  contactReplyIntro: 'Wir haben auf Ihre Nachricht geantwortet. Sie können die Antwort unten lesen.',
  greeting: (name) => (name ? `Hallo ${name},` : 'Hallo,'),
  verifyIntro: 'Bitte bestätigen Sie Ihre E-Mail-Adresse, um Ihr Konto zu aktivieren.',
  resetIntro: 'Klicken Sie auf den untenstehenden Button, um Ihr Passwort zurückzusetzen.',
  receiptIntro: 'Vielen Dank für Ihren Kauf. Hier ist Ihr Beleg.',
  grantIntro: 'Ein Administrator hat Ihnen Token gutgeschrieben. Ihr Guthaben wurde aktualisiert.',
  buttonVerify: 'E-Mail bestätigen',
  buttonReset: 'Passwort zurücksetzen',
  buttonOpen: 'Öffnen',
  buttonReply: 'Auf Nachricht antworten',
  buttonViewTokens: 'Rechnung anzeigen',
  footerNote: 'Falls Sie dies nicht angefordert haben, können Sie diese E-Mail ignorieren.'
};

const IT: EmailStrings = {
  appName: 'Jarnazi AI Consensus',
  verifySubject: 'Verifica la tua email',
  resetSubject: 'Reimposta la tua password',
  receiptSubject: 'Ricevuta d\'acquisto dei token',
  grantSubject: 'Hai ricevuto dei token',
  contactReplySubject: 'Risposta dal supporto',
  contactReplyIntro: 'Abbiamo risposto al tuo messaggio. Puoi leggere la risposta qui sotto.',
  greeting: (name) => (name ? `Ciao ${name},` : 'Ciao,'),
  verifyIntro: 'Per favore verifica la tua email per attivare il tuo account.',
  resetIntro: 'Usa il pulsante qui sotto per reimpostare la tua password.',
  receiptIntro: 'Grazie per il tuo acquisto. Ecco la tua ricevuta.',
  grantIntro: 'Un amministratore ti ha assegnato dei token. Il tuo saldo è stato aggiornato.',
  buttonVerify: 'Verifica email',
  buttonReset: 'Reimposta password',
  buttonOpen: 'Apri',
  buttonReply: 'Rispondi al messaggio',
  buttonViewTokens: 'Visualizza fattura',
  footerNote: 'Se non hai richiesto tu questa operazione, puoi ignorare questa email.'
};

const JA: EmailStrings = {
  appName: 'Jarnazi AI Consensus',
  verifySubject: 'メールアドレスの確認',
  resetSubject: 'パスワードのリセット',
  receiptSubject: 'トークン購入領収書',
  grantSubject: 'トークンが付与されました',
  contactReplySubject: 'サポートからの返信',
  contactReplyIntro: '返信がありました。以下から内容を確認いただけます。',
  greeting: (name) => (name ? `${name}様、` : 'こんにちは、'),
  verifyIntro: 'アカウントを有効にするために、メールアドレスを確認してください。',
  resetIntro: '下のボタンをクリックしてパスワードをリセットしてください。',
  receiptIntro: 'ご購入ありがとうございます。領収書をお送りします。',
  grantIntro: '管理者からトークンが付与されました。残高が更新されました。',
  buttonVerify: 'メールを確認する',
  buttonReset: 'パスワードを再設定',
  buttonOpen: '開く',
  buttonReply: 'メッセージに返信する',
  buttonViewTokens: '請求書を表示',
  footerNote: 'このメールに心当たりがない場合は、無視していただいて構いません。'
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
  buttonReply: 'رد على الرسالة',
  buttonViewTokens: 'عرض الفاتورة',
  footerNote: 'إذا لم تطلب هذا الإجراء، يمكنك تجاهل هذا البريد بأمان.'
};

const FR: EmailStrings = {
  appName: 'Jarnazi AI Consensus',
  verifySubject: 'Vérifiez votre adresse e-mail',
  resetSubject: 'Réinitialisez votre mot de passe',
  receiptSubject: 'Votre reçu d\'achat de jetons',
  grantSubject: 'Vous avez reçu des jetons',
  contactReplySubject: 'Réponse du support',
  contactReplyIntro: 'Nous avons répondu à votre message. Vous pouvez lire la réponse ci-dessous.',
  greeting: (name) => (name ? `Bonjour ${name},` : 'Bonjour,'),
  verifyIntro: 'Veuillez vérifier votre adresse e-mail pour activer votre compte.',
  resetIntro: 'Utilisez le bouton ci-dessous pour réinitialiser votre mot de passe.',
  receiptIntro: 'Merci pour votre achat. Voici votre reçu.',
  grantIntro: 'Un administrateur vous a accordé des jetons. Votre solde a été mis à jour.',
  buttonVerify: 'Vérifier l\'e-mail',
  buttonReset: 'Réinitialiser le mot de passe',
  buttonOpen: 'Ouvrir',
  buttonReply: 'Répondre au message',
  buttonViewTokens: 'Voir la facture',
  footerNote: 'Si vous n\'avez pas demandé cela, vous pouvez ignorer cet e-mail en toute sécurité.'
};

const SV: EmailStrings = {
  appName: 'Jarnazi AI Consensus',
  verifySubject: 'Bekräfta din e-postadress',
  resetSubject: 'Återställ ditt lösenord',
  receiptSubject: 'Ditt kvitto för tokenköp',
  grantSubject: 'Du har fått tokens',
  contactReplySubject: 'Svar från support',
  contactReplyIntro: 'Vi har svarat på ditt meddelande. Du kan läsa svaret nedan.',
  greeting: (name) => (name ? `Hej ${name},` : 'Hej,'),
  verifyIntro: 'Bekräfta din e-postadress för att aktivera ditt konto.',
  resetIntro: 'Använd knappen nedan för att återställa ditt lösenord.',
  receiptIntro: 'Tack för ditt köp. Här är ditt kvitto.',
  grantIntro: 'En administratör har gett dig tokens. Ditt saldo har uppdaterats.',
  buttonVerify: 'Bekräfta e-post',
  buttonReset: 'Återställ lösenord',
  buttonOpen: 'Öppna',
  buttonReply: 'Svara på meddelande',
  buttonViewTokens: 'Visa faktura',
  footerNote: 'Om du inte har begärt detta kan du ignorera detta e-postmeddelande.'
};

export function getEmailStrings(lang?: string): EmailStrings {
  const key = (lang || 'en').toLowerCase();
  if (key.startsWith('ar')) return AR;
  if (key.startsWith('es')) return ES;
  if (key.startsWith('pt')) return PT;
  if (key.startsWith('de')) return DE;
  if (key.startsWith('it')) return IT;
  if (key.startsWith('ja')) return JA;
  if (key.startsWith('fr')) return FR;
  if (key.startsWith('sv')) return SV;
  return EN;
}
