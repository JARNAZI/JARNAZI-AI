import { getSetting } from '@/lib/settings';
import { getDictionary } from '@/i18n/get-dictionary';
import Link from 'next/link';
import { renderMarkdown } from '@/lib/markdown';

export const dynamic = 'force-dynamic';

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const rawMarkdown = await getSetting<string>('privacy_policy', '');
  const html = renderMarkdown(rawMarkdown);

  return (
    <main className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-3xl mx-auto">
        <Link href={`/${lang}`} className="text-sm text-zinc-400 hover:text-white flex items-center gap-1">
          ← {dict.common.back}
        </Link>
        <div className="prose dark:prose-invert max-w-none mt-6" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </main>
  );
}

