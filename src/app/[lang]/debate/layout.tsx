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

  // Important: do NOT force dark colors here.
  // The app uses a theme system (light/dark), so we rely on the shared tokens.
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <SessionBackGuard lang={lang} redirectPath="login" />
      {children}
    </div>
  );
}
