import type { ReactNode } from 'react';
import SessionBackGuard from '@/components/auth/SessionBackGuard';

export default async function DebateLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  // Important: do NOT force dark colors here.
  // The app uses a theme system (light/dark), so we rely on the shared tokens.
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <SessionBackGuard
        lang={lang}
        redirectPath="login"
        supabaseUrl={supabaseUrl}
        supabaseAnonKey={supabaseAnonKey}
      />
      {children}
    </div>
  );
}
