'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { sendAdminAlert, sendContactReply } from '@/lib/email';
import { createNotification } from '@/lib/notifications';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

const contactSchema = z.object({
    name: z.string().max(25).refine(val => !val.split(/\s+/).some(w => w.length > 20), { message: "Invalid name format." }),
    email: z.string().email(),
    subject: z.string().max(20),
    message: z.string().max(250).refine((val) => {
        // Block extremely long strings without spaces (gibberish/bot spam)
        if (val.split(/\s+/).some(word => word.length > 40)) return false;
        if (!val.includes(' ') && val.length > 25) return false;
        return true;
    }, { message: "Message contains invalid formatting or appears to be spam." }),
});

export async function submitContactForm(prevState: unknown, formData: FormData) {
    const supabase = await createClient();
    const { createServiceRoleClient } = await import('@/lib/supabase/server-admin');
    const adminClient = await createServiceRoleClient();
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';

    // 0. Honeypot check (hidden field to trap bots that change IPs)
    const honeypot = formData.get('website_url') as string;
    if (honeypot) {
        // If honeypot is filled, it's definitely a bot. Block silently or ban IP.
        try {
            // Attempt to ban the IP using admin client
            const { createClient: createAdminClient } = await import('@supabase/supabase-js');
            const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
            const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
            if (url && key) {
                const admin = createAdminClient(url, key);
                await admin.from('banned_ips').insert({ ip, reason: 'Caught in contact honeypot' });
            }
        } catch (e) { }
        console.warn(`Honeypot triggered by IP: ${ip}`);
        return { success: false, error: 'System is receiving too many requests. Please try again later.' }; // fake error
    }

    // Validate
    const rawData = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        subject: formData.get('subject') as string,
        message: formData.get('message') as string,
    };
    const turnstileToken = formData.get('turnstileToken') as string;

    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (turnstileSecret) {
        if (!turnstileToken) {
            return { success: false, error: 'Security check missing or empty.' };
        }
        try {
            const tRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `secret=${turnstileSecret}&response=${turnstileToken}`
            });
            const tData = await tRes.json();
            if (!tData.success) {
                return { success: false, error: 'Security sequence failed. Are you a bot?' };
            }
        } catch (e) {
            return { success: false, error: 'Cloudflare Turnstile verification failed. Try again.' };
        }
    }

    const validation = contactSchema.safeParse(rawData);
    if (!validation.success) {
        const errors = validation.error.flatten().fieldErrors;
        const firstError = Object.values(errors)[0]?.[0] || 'Invalid input';
        return { success: false, error: firstError };
    }

    try {
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Check if IP is banned (Using Admin client to bypass RLS)
        try {
            const { createClient: createAdminClient } = await import('@supabase/supabase-js');
            const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
            const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
            if (url && key) {
                const admin = createAdminClient(url, key);
                const { data: bannedRow } = await admin.from('banned_ips').select('ip').eq('ip', ip).maybeSingle();
                if (bannedRow) {
                    return { success: false, error: 'Your IP has been flagged for abnormal activity.' };
                }
            }
        } catch (e) { console.error('Banned IP check failed', e); }

        // 2. Strict Rate limit per IP OR user OR email (max 3 messages per 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

        let rateLimitQuery = supabase
            .from('contact_messages')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', fiveMinutesAgo);

        if (user) {
            rateLimitQuery = rateLimitQuery.eq('user_id', user.id);
        } else {
            rateLimitQuery = rateLimitQuery.or(`email.eq.${rawData.email},ip_address.eq.${ip}`);
        }

        const { count } = await rateLimitQuery;
        if (count !== null && count >= 3) {
            // Auto-ban IP if they try >6 times in 5 mins (aggressive attack)
            if (count > 6) {
                try {
                    const { createClient: createAdminClient } = await import('@supabase/supabase-js');
                    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
                    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
                    if (url && key) {
                        const admin = createAdminClient(url, key);
                        await admin.from('banned_ips').insert({ ip, reason: 'Exceeded rate limits aggressively (IP)' });
                    }
                } catch (e) { }
            }
            return { success: false, error: 'Too many requests. Please wait a few minutes before sending another message.' };
        }

        // 3. Global rate limit for anonymous messages to prevent distributed bot spam (botnets varying IP)
        if (!user) {
            const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
            const { count: globalCount } = await supabase
                .from('contact_messages')
                .select('id', { count: 'exact', head: true })
                .is('user_id', null)
                .gte('created_at', oneMinuteAgo);

            if (globalCount !== null && globalCount >= 10) {
                return { success: false, error: 'System is receiving too many requests. Please try again later.' };
            }
        }

        // Insert
        // Insert using admin client to bypass RLS limits on anonymous guests
        const { error } = await adminClient.from('contact_messages').insert({
            user_id: user?.id || null, // Optional, allow guests if policy permits
            ip_address: ip,
            ...rawData,
            status: 'pending'
        });

        if (error) throw error;

        // Admin Alert
        await sendAdminAlert('New Contact Inquiry', `From: ${rawData.name} (${rawData.email})\nSubject: ${rawData.subject}\n\n${rawData.message}`);

        return { success: true };
    } catch (error: unknown) {
        console.error('Contact Form Error:', error);
        return { success: false, error: 'Failed to submit message. Please try again.' };
    }
}

export async function replyToMessage(messageId: string, replyText: string, lang?: string) {
    const supabase = await createClient();
    const { createServiceRoleClient } = await import('@/lib/supabase/server-admin');
    const admin = await createServiceRoleClient();

    // Get message details first using admin client to bypass RLS block on selects
    const { data: message } = await admin.from('contact_messages').select('*').eq('id', messageId).single();
    if (!message) throw new Error('Message not found');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Send Email FIRST so if it fails, Database is not updated
    await sendContactReply(message.email, {
        name: message.name || undefined,
        subject: message.subject || undefined,
        originalMessage: message.message || undefined,
        replyText,
        lang,
    });

    // No need to manually create the admin client again, we imported it above.
    
    // Update DB AFTER email was successfully sent
    const { error } = await admin.from('contact_messages').update({
        status: 'replied',
        admin_reply: replyText,
        replied_at: new Date().toISOString(),
        replied_by: user.id
    }).eq('id', messageId);

    if (error) {
        console.error("Failed to update contact message status:", error);
        throw new Error("Failed to update message status after sending email.");
    }

    // Send In-App Notification if user is registered using Admin client
    if (message.user_id) {
        try {
            await admin.from('notifications').insert({
                user_id: message.user_id,
                title: '/contact',
                body: `Support replied to: ${message.subject}`,
                type: 'success',
                is_read: false
            });
        } catch (err) {
            console.error('Failed to create in-app notification:', err);
        }
    }

    revalidatePath('/admin/messages');
    return { success: true };
}

