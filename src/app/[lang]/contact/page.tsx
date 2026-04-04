import ContactClient from './ContactClient';

export const dynamic = 'force-dynamic';

export default async function ContactPage() {
    const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_API_SITE_KEY;
    
    return <ContactClient siteKey={siteKey} />;
}
