import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

// Support multiple key name variations
const RESEND_API_KEY =
    Deno.env.get("RESEND_API_KEY") ||
    Deno.env.get("Resend_api_key") ||
    Deno.env.get("RESEND_API_KEY_LIVE") ||
    Deno.env.get("resend_api_key");

const EMAIL_FUNCTION_SECRET = Deno.env.get("EMAIL_FUNCTION_SECRET");
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "system@jarnazi.com";

interface EmailRequest {
    to: string[] | string
    subject?: string
    type?: 'verification' | 'reset-password' | 'billing' | 'notification' | 'custom'
    data?: any
    html?: string
    lang?: string
}

console.log("Send Email Function Initialized");
console.log("- Resend Key Status:", RESEND_API_KEY ? `CONFIGURED (Ends with ...${RESEND_API_KEY.slice(-4)})` : "MISSING");
console.log("- Security Secret Status:", EMAIL_FUNCTION_SECRET ? "CONFIGURED" : "MISSING (Public Access Blocked if enforced)");
console.log("- From Email:", RESEND_FROM_EMAIL);

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
    <div style="background: #0b0f19; padding: 32px 24px; text-align: center; border-radius: 24px 24px 0 0; border-bottom: 1px solid rgba(255,255,255,0.08);">
        ${logoUrl ? `<img src="${logoUrl}" alt="${brandName}" style="max-width: 64px; height: auto; margin: 0 auto 12px; display:block; border-radius: 12px;" />` : ``}
        <h1 style="color: #fff; margin: 0; font-size: 18px; letter-spacing: 1px; text-transform: uppercase; font-weight: 800;">${brandName}</h1>
    </div>
    <div style="background: #111827; padding: 32px 24px; color: #e5e7eb;">
`;

const FOOTER_TEMPLATE = (baseUrl: string) => `
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.08);">
        <p style="margin: 0; color: #667085; font-size: 12px; line-height: 1.6;">
            If you didn’t request this, you can safely ignore this email.
        </p>
        <p style="margin: 10px 0 0; color: #94a3b8; font-size: 11px; font-weight: 600;">
            © ${new Date().getFullYear()} Jarnazi AI • <a href="${baseUrl}" style="color:#06b6d4;text-decoration:none;">Visit Site</a>
        </p>
    </div>
    </div>
`;

serve(async (req) => {
    // CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // SECURITY CHECK: Validate shared secret
        const providedSecret = req.headers.get("x-email-secret");

        // If EMAIL_FUNCTION_SECRET is set, we MUST match it.
        // If it's NOT set, we log a warning but technically we shouldn't allow it in production.
        if (EMAIL_FUNCTION_SECRET && providedSecret !== EMAIL_FUNCTION_SECRET) {
            console.error("Security violation: Invalid x-email-secret header provided");
            return new Response(JSON.stringify({ error: "Unauthorized: Invalid security token" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            });
        }

        if (!EMAIL_FUNCTION_SECRET) {
            console.warn("WARNING: EMAIL_FUNCTION_SECRET is not set in environment variables. Function is running without shared secret verification.");
        }

        if (!RESEND_API_KEY) {
            console.error("CRITICAL: RESEND_API_KEY is missing");
            throw new Error("SUPABASE_EDGE_FUNCTION_ERROR: RESEND_API_KEY is missing. Please set it using 'supabase secrets set RESEND_API_KEY=your_key'")
        }

        const payload: EmailRequest = await req.json()
        const { to, subject: reqSubject, type, data, html: reqHtml } = payload

        console.log(`Email request received for: ${Array.isArray(to) ? to.join(', ') : to} (Type: ${type || 'custom'})`);

        const baseUrl = (data?.baseUrl || 'https://jarnazi.com').replace(/\/$/, '');
        const brandName = data?.brandName || 'Jarnazi AI';
        const logoUrl = data?.logoUrl || `${baseUrl}/logo.png`;
        const HEADER = HEADER_TEMPLATE(brandName, logoUrl);
        const FOOTER = FOOTER_TEMPLATE(baseUrl);

        let htmlContent = "";
        let finalSubject = reqSubject || "[Jarnazi] Notification";

        // --- TEMPLATE LOGIC ---
        if (reqHtml) {
            htmlContent = reqHtml;
        } else if (type === 'verification') {
            finalSubject = `[Jarnazi] Verify Your Identity`;
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
            finalSubject = `[Jarnazi] Password Reset Request`;
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
            finalSubject = `[Jarnazi] Token Allocation Receipt`;
            htmlContent = `
                ${HEADER}
                <h2 style="color: #000; margin-bottom: 20px;">Invoice & Token Allocation</h2>
                <p>Your consensus token purchase was successful.</p>
                <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px 0;">Plan</td>
                        <td style="text-align: right; font-weight: bold;">${data.planName || 'Tokens'}</td>
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
            htmlContent = `
                ${HEADER}
                <h2 style="color: #000; margin-bottom: 20px;">Council Notification</h2>
                <p>${data?.message || 'New update from the Council.'}</p>
                ${FOOTER}
            `;
        }

        const normalizedTo = Array.isArray(to) ? to : [to];

        console.log(`Sending email via Resend to ${normalizedTo.length} recipients...`);

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: RESEND_FROM_EMAIL,
                to: normalizedTo,
                subject: finalSubject,
                html: reqHtml ? htmlContent : `<div style="${SUBSCRIPTION_STYLES}">${htmlContent}</div>`,
            }),
        })

        const resData = await res.json()

        if (!res.ok) {
            console.error("Resend API Error:", res.status, JSON.stringify(resData));
            return new Response(JSON.stringify({
                error: "Resend API error",
                details: resData,
                status: res.status
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: res.status,
            })
        }

        console.log("Email sent successfully! Resend ID:", resData.id);

        return new Response(JSON.stringify(resData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        console.error("Edge Function Exception:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})


