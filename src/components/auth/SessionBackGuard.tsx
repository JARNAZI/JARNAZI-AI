"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SessionBackGuard({
  lang,
  redirectPath = "login",
}: {
  lang: string;
  redirectPath?: string;
}) {
  useEffect(() => {
    const supabase = createClient();

    const redirect = () => {
      // Force a full navigation so the browser can't show a cached protected page.
      window.location.replace(`/${lang}/${redirectPath}`);
    };

    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data?.session) redirect();
      } catch {
        redirect();
      }
    };

    // Initial check
    checkSession();

    // If the page is restored from the back/forward cache, re-check auth.
    const onPageShow = (e: PageTransitionEvent) => {
      if ((e as any).persisted) checkSession();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") checkSession();
    };

    const onPopState = () => {
      checkSession();
    };

    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("popstate", onPopState);
    };
  }, [lang, redirectPath]);

  return null;
}
