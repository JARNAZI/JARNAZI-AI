import { getSetting } from '@/lib/settings';
import Link from 'next/link';

export default async function TermsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const html = await getSetting<string>('terms_text', '<h1>Terms of Use</h1><p>Coming soon.</p>');

  return (
    <main className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-3xl mx-auto">
        <Link href={`/${lang}`} className="text-sm text-muted-foreground hover:text-foreground">
          ← Home
        </Link>
        <div className="prose dark:prose-invert max-w-none mt-6" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </main>
  );
}
