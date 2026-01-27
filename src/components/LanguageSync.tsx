"use client";

import { useEffect } from "react";

export function LanguageSync({ lang }: { lang: string }) {
    useEffect(() => {
        if (!lang) return;
        try {
            localStorage.setItem("locale", lang);
            document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=${60 * 60 * 24 * 365}`;
            document.cookie = `locale=${lang}; path=/; max-age=${60 * 60 * 24 * 365}`; // Redundant but requested ("locale" cookie)
        } catch (e) {
            console.error("Failed to sync language", e);
        }
    }, [lang]);

    return null;
}
