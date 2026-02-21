"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SessionBackGuard({
  lang,
  redirectPath = "login",
  supabaseUrl,
  supabaseAnonKey,
}: {
  lang: string;
  redirectPath?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}) {
  useEffect(() => {
    const supabase = createClient({ supabaseUrl, supabaseAnonKey });

    const handleRedirect = () => {
      window.location.replace(`/${lang}/${redirectPath}`);
    };

    // Check session on mount and listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        handleRedirect();
      } else if (!session && event === 'INITIAL_SESSION') {
        // Double check after a small delay to avoid race conditions during redirects
        setTimeout(async () => {
          const { data } = await supabase.auth.getSession();
          if (!data.session) handleRedirect();
        }, 1500);
      }
    });

    // Handle bfcache restore (Back button)
    const onPageShow = async (e: PageTransitionEvent) => {
      if (e.persisted) {
        // Wait for potential session re-hydration
        await new Promise(r => setTimeout(r, 500));
        const { data } = await supabase.auth.getSession();
        if (!data.session) handleRedirect();
      }
    };

    window.addEventListener("pageshow", onPageShow);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [lang, redirectPath, supabaseUrl, supabaseAnonKey]);

  return null;
}
