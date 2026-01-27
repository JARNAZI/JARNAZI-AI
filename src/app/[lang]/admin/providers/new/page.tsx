'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ProviderForm from '@/components/admin/ProviderForm';

export default function NewProviderPage({ params }: { params: { lang: string } }) {
    const { lang } = params;
    return (
        <div className="p-8 max-w-2xl mx-auto">
            <Link href={`/${lang}/admin/providers`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Providers
            </Link>

            <h1 className="text-2xl font-bold text-foreground mb-8">Add Neural Node</h1>

            <ProviderForm lang={lang} />
        </div>
    );
}
