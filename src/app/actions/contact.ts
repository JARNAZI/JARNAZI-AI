'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { sendAdminAlert, sendContactReply } from '@/lib/email';
import { createNotification } from '@/lib/notifications';
import { revalidatePath } from 'next/cache';

const contactSchema = z.object({
    name: z.string().max(25),
    email: z.string().email(),
    subject: z.string().max(20),
    message: z.string().max(250),
});

export async function submitContactForm(prevState: any, formData: FormData) {
    const supabase = await createClient();

    // Validate
    const rawData = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        subject: formData.get('subject') as string,
        message: formData.get('message') as string,
    };

    const validation = contactSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, error: validation.error.format()._errors.join(', ') || 'Invalid input' };
    }

    try {
        const { data: { user } } = await supabase.auth.getUser();

        // Insert
        const { error } = await supabase.from('contact_messages').insert({
            user_id: user?.id || null, // Optional, allow guests if policy permits
            ...rawData,
            status: 'pending'
        });

        if (error) throw error;

        // Admin Alert
        await sendAdminAlert('New Contact Inquiry', `From: ${rawData.name} (${rawData.email})\nSubject: ${rawData.subject}\n\n${rawData.message}`);

        return { success: true };
    } catch (error: any) {
        console.error('Contact Form Error:', error);
        return { success: false, error: 'Failed to submit message. Please try again.' };
    }
}

export async function replyToMessage(messageId: string, replyText: string) {
    const supabase = await createClient();

    // Get message details first
    const { data: message } = await supabase.from('contact_messages').select('*').eq('id', messageId).single();
    if (!message) throw new Error('Message not found');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Update DB
    const { error } = await supabase.from('contact_messages').update({
        status: 'replied',
        reply_text: replyText,
        replied_at: new Date().toISOString(),
        replied_by: user.id
    }).eq('id', messageId);

    if (error) throw error;

    // Send Email
    await sendContactReply(message.email, message.name, message.message, replyText);

    // Send In-App Notification if user is registered
    if (message.user_id) {
        await createNotification(
            message.user_id,
            `Support replied to: ${message.subject}`,
            'success',
            '/settings' // Or a specific messages view if we had one
        );
    }

    revalidatePath('/admin/messages');
    return { success: true };
}
