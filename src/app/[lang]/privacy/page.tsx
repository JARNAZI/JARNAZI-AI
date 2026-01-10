import { getSetting } from '@/lib/settings';
import Link from 'next/link';

export default async function PrivacyPage({ params }: { params: { lang: string } }) {
  const html = await getSetting<string>('privacy_text', '<h1>Privacy Policy</h1><p>Coming soon.</p>');
  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-3xl mx-auto">
        <Link href={`/${params.lang}`} className="text-sm text-zinc-400 hover:text-white">← Home</Link>
        <div className="prose prose-invert max-w-none mt-6" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </main>
  );
}
