import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Updated to accept full actionLink
export const sendVerificationEmail = async (email: string, actionLink: string) => {
  try {
    await resend.emails.send({
      from: 'Jarnazi AI <onboarding@jarnazi.com>',
      to: email,
      subject: 'Confirm your identity',
      html: `
        <div style="font-family: sans-serif; color: #333; padding: 20px;">
          <h1 style="color: #000;">Welcome to Jarnazi AI Consensus</h1>
          <p>Please verify your email address to access the Council.</p>
          <a href="${actionLink}" style="display: inline-block; padding: 12px 24px; background-color: #5850ec; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">If the button above does not work, copy and paste this link:<br/>${actionLink}</p>
        </div>
      `
    });
  } catch (error) {
    console.error("Resend Error:", error);
  }
};

export const sendPasswordResetEmail = async (email: string, actionLink: string) => {
  try {
    await resend.emails.send({
      from: 'Jarnazi AI <support@jarnazi.com>',
      to: email,
      subject: 'Reset Your Password',
      html: `
        <div style="font-family: sans-serif; color: #333; padding: 20px;">
          <h1 style="color: #000;">Reset Password</h1>
          <p>You requested a password reset. Click the button below to secure your account.</p>
          <a href="${actionLink}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">This link expires in 1 hour.</p>
        </div>
      `
    });
  } catch (error) {
    console.error("Resend Error:", error);
  }
};

export const sendInvoiceEmail = async (email: string, invoiceUrl: string, amount: string) => {
  try {
    await resend.emails.send({
      from: 'Jarnazi AI <billing@jarnazi.com>',
      to: email,
      subject: 'Your Jarnazi Invoice',
      html: `
        <div style="font-family: sans-serif; color: #333;">
          <h1>Invoice Ready</h1>
          <p>Thank you for your purchase.</p>
          <p>Amount: <strong>${amount}</strong></p>
          <a href="${invoiceUrl}" style="padding: 12px 24px; background-color: #000; color: white; text-decoration: none; border-radius: 5px;">Download Invoice</a>
        </div>
      `
    });
  } catch (error) {
    console.error("Resend Error:", error);
  }
};
