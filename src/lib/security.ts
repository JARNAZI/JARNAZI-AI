import 'server-only';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import { createClient } from '@supabase/supabase-js';

// --- Configuration ---
const MAX_DEBATES_PER_HOUR = 5;
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const SAFE_BROWSING_URL = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';

// Initialize Admin Client for Security Checks lazily inside functions
// to prevent build-time errors when env vars are missing.

// --- Zod Schemas ---
export const DebateSchema = z.object({
    topic: z.string().min(5).max(200).trim(), // Strict length limits
    requestType: z.enum(['text', 'image', 'video', 'audio', 'file']).optional(),
    userId: z.string().uuid(),
    turnstileToken: z.string().optional()
});

export const AuthSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6).max(100),
    turnstileToken: z.string().optional() // Make optional for now to not break login if not updated instantly, but we should enforce it.
});

// --- Security Functions ---

/**
 * 1. Input Sanitization
 * Removes HTML tags and scripts to prevent XSS.
 */
export function sanitizeInput(input: string): string {
    return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [], // No HTML allowed in topic
        ALLOWED_ATTR: []
    });
}

/**
 * 2. Cloudflare Turnstile Verification
 */
export async function verifyTurnstileToken(token: string, ip?: string): Promise<boolean> {
    const secret = process.env.CLOUDFLARE_TURNSTILE_API_SECRET_KEY;

    console.log(`[Diagnostic] Turnstile Secret Key configured: ${!!secret}`);

    if (!secret) {
        console.warn("CLOUDFLARE_TURNSTILE_API_SECRET_KEY not set. Bypassing check (Dev mode).");
        return true;
    }

    try {
        const formData = new FormData();
        formData.append('secret', secret);
        formData.append('response', token);
        if (ip) formData.append('remoteip', ip);

        const result = await fetch(TURNSTILE_VERIFY_URL, {
            body: formData,
            method: 'POST',
        });

        const outcome = await result.json();
        return outcome.success;
    } catch (e) {
        console.error("Turnstile verification failed:", e);
        return false;
    }
}

/**
 * 3. Google Safe Browsing
 * Checks if the topic contains malicious URLs or phrases (if text analysis is supported, mainly for URLs within text).
 */
export async function checkSafeBrowsing(text: string): Promise<boolean> {
    const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    if (!apiKey) return true; // Bypass if no key

    // Extract URLs from text
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex);

    if (!urls || urls.length === 0) return true;

    const requestBody = {
        client: {
            clientId: "jarnazi-debate-ai",
            clientVersion: "1.0.0"
        },
        threatInfo: {
            threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: urls.map(url => ({ url }))
        }
    };

    try {
        const response = await fetch(`${SAFE_BROWSING_URL}?key=${apiKey}`, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();
        // If matches found, it's unsafe
        return !data.matches || data.matches.length === 0;
    } catch (e) {
        console.error("Safe Browsing check failed:", e);
        return true; // Fail open to avoid blocking valid users on API error, or Fail Closed? Strict means Fail Closed usually.
        // For this demo, let's Fail Open but log error.
    }
}

/**
 * 4. Anti-Abuse Rate Limiting
 * Strict DB-based check.
 */
export async function checkRateLimit(userId: string): Promise<boolean> {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { count, error } = await supabaseAdmin
        .from('debates')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', oneHourAgo);

    if (error) {
        console.error("Rate limit check db error:", error);
        return false; // Fail safe
    }

    return (count || 0) < MAX_DEBATES_PER_HOUR;
}

/**
 * 5. Code Injection Prevention Helper
 * Simple heuristic to block obvious SQL/Code injection patterns if they bypass sanitization.
 * (Note: storage is safe via Supabase param queries, this is an extra layer for Orchestrator inputs)
 */
export function validateContentSafety(text: string): boolean {
    const suspiciousPatterns = [
        /exec\(\s*['"]/,
        /eval\(\s*['"]/,
        /UNION\s+SELECT/i,
        /DROP\s+TABLE/i,
        /<script>/i,
        /javascript:/i
    ];

    for (const pattern of suspiciousPatterns) {
        if (pattern.test(text)) return false;
    }
    return true;
}
