import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import SessionBackGuard from "@/components/auth/SessionBackGuard";

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Resolve role from profiles table with fallback to app_metadata (JWT)
  let profileRole: string | null = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    profileRole = (data?.role as string | null) || (user.app_metadata?.role as string | null) || null;
  }

  const role = profileRole ?? "user";
  const isSupport = role === "support";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <SessionBackGuard
        lang={lang}
        redirectPath="login"
        supabaseUrl={supabaseUrl}
        supabaseAnonKey={supabaseAnonKey}
      />
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/60 p-6 hidden md:block">
        <Link href={`/${lang}/admin`} className="flex items-center gap-2 mb-8 group">
          <Image
            src="/logo.jpg"
            alt="Jarnazi Logo"
            width={32}
            height={32}
            className="rounded shadow-[0_0_10px_rgba(99,102,241,0.2)] group-hover:scale-110 transition-transform"
          />
          <div className="text-xl font-bold text-foreground flex items-center">
            JARNAZI<span className="text-red-500 text-xs ml-1">ADMIN</span>
          </div>
        </Link>

        <nav className="space-y-4">
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Core</div>

          {!isSupport && (
            <Link
              href={`/${lang}/admin/users`}
              className="block px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              Users
            </Link>
          )}

          <Link
            href={`/${lang}/admin/messages`}
            className="block px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            Messages
          </Link>

          {!isSupport && (
            <Link
              href={`/${lang}/admin/api-status`}
              className="block px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              API Status
            </Link>
          )}

          {!isSupport && (
            <>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider pt-4">Configuration</div>

              <Link
                href={`/${lang}/admin/models`}
                className="block px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                Models
              </Link>

              <Link
                href={`/${lang}/admin/providers`}
                className="block px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                AI Providers
              </Link>
              <Link
                href={`/${lang}/admin/costs`}
                className="block px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                AI Costs
              </Link>


              <Link
                href={`/${lang}/admin/settings`}
                className="block px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                Settings & Plans
              </Link>
            </>
          )}
        </nav>
      </aside>

      <main className="flex-1">{children}</main>
    </div>
  );
}
