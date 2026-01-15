import { serve } fro        const baseUrl = data?.baseUrl || 'https://jarnazi.com';
        const brandName = data?.brandName || 'Jarnazi AI';
        const logoUrl = data?.logoUrl;
        const HEADER = HEADER_TEMPLATE(brandName, logoUrl);
        const FOOTER = FOOTER_TEMPLATE(baseUrl);
m "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

// MANDATORY KEY: Resend_api_key (Strict reference)
const RESEND_API_KEY = Deno.env.get("Resend_api_key")

interface EmailRequest {
    to: string[]
    subject: string
    type: 'verification' | 'reset-password' | 'billing' | 'notification'
    data: any
    lang?: string
}

console.log("Send Email Function Initialized")

const SUBSCRIPTION_STYLES = `
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #333;
    line-height: 1.6;
    max-width: 600px;
    margin: 0 auto;
    background: #f9f9f9;
    padding: 20px;
`;

const HEADER_TEMPLATE = (brandName: string, logoUrl?: string) => `
    <div style="background: #0b0f19; padding: 22px 20px; text-align: center; border-radius: 14px 14px 0 0;">
        ${logoUrl ? `<img src="${logoUrl}" alt="${brandName}" style="max-width: 120px; height: auto; margin: 0 auto 10px; display:block;" />` : ``}
        <h1 style="color: #fff; margin: 0; font-size: 22px; letter-spacing: 2px; text-transform: uppercase;">${brandName}</h1>
        <p style="color: #8a93a5; font-size: 12px; margin: 8px 0 0; letter-spacing: 1px; text-transform: uppercase;">AI Consensus System</p>
    </div>
    <div style="background: #ffffff; padding: 28px; border-radius: 0 0 14px 14px; box-shadow: 0 10px 25px rgba(0,0,0,0.15);">
`;

const FOOTER_TEMPLATE = (baseUrl: string) => `
    <div style="margin-top: 28px; padding-top: 18px; border-top: 1px solid #e7eaf0;">
        <p style="margin: 0; color: #667085; font-size: 12px; line-height: 1.6;">
            If you didn’t request this, you can safely ignore this email.
        </p>
        <p style="margin: 10px 0 0; color: #98a2b3; font-size: 11px;">
            © ${new Date().getFullYear()} Jarnazi AI • <a href="${baseUrl}" style="color:#667085;text-decoration:none;">Visit site</a>
        </p>
    </div>
    </div>
`;

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        if (!RESEND_API_KEY) {
            throw new Error("Missing critical key: Resend_api_key")
        }

        const { to, subject, type, data }: EmailRequest = await req.json()
        let htmlContent = "";

        // --- TEMPLATE LOGIC ---
        if (type === 'verification') {
            htmlContent = `
                ${HEADER}
                <h2 style="color: #000; margin-bottom: 20px;">Verify Your Consensus Identity</h2>
                <p>Welcome to the Council. To activate your secure voting access, please verify your email address.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${data.url}" style="background: #4F46E5; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Verify Identity</a>
                </div>
                <p style="font-size: 12px; color: #666;">If you did not request this, please ignore this communication.</p>
                ${FOOTER}
            `;
        } else if (type === 'reset-password') {
            htmlContent = `
                ${HEADER}
                <h2 style="color: #000; margin-bottom: 20px;">Security Alert: Password Reset</h2>
                <p>A request to reset your secure access credentials was received.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${data.url}" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Reset Password</a>
                </div>
                ${FOOTER}
            `;
        } else if (type === 'billing') {
            htmlContent = `
                ${HEADER}
                <h2 style="color: #000; margin-bottom: 20px;">Invoice & Token Allocation</h2>
                <p>Your consensus token purchase was successful.</p>
                <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px 0;">Plan</td>
                        <td style="text-align: right; font-weight: bold;">${data.planName}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px 0;">Amount</td>
                        <td style="text-align: right; font-weight: bold;">${data.amount}</td>
                    </tr>
                </table>
                <p>Thank you for supporting the global intellect.</p>
                ${FOOTER}
            `;
        } else {
            // Generic Notification
            htmlContent = `
                ${HEADER}
                <h2 style="color: #000; margin-bottom: 20px;">Council Notification</h2>
                <p>${data.message}</p>
                ${FOOTER}
            `;
        }

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "Jarnazi AI <system@jarnazi.com>",
                to: to,
                subject: `[Jarnazi] ${subject}`,
                html: `<div style="${SUBSCRIPTION_STYLES}">${htmlContent}</div>`,
            }),
        })

        const resData = await res.json()

        if (!res.ok) {
            return new Response(JSON.stringify(resData), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: res.status,
            })
        }

        return new Response(JSON.stringify(resData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
