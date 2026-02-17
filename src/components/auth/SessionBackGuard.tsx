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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        handleRedirect();
      }
    });

    // Handle bfcache restore (Back button)
    const onPageShow = async (e: PageTransitionEvent) => {
      if (e.persisted) {
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
