'use client'

import { usePathname, useRouter } from 'next/navigation'
import { LANGUAGES } from '@/i18n/config'

export default function LangSwitcher() {
    const pathname = usePathname()
    const router = useRouter()

    const currentLang = pathname.split('/')[1] || 'en'

    const handleSwitch = (newLang: string) => {
        if (!pathname) return
        const segments = pathname.split('/')
        if (segments.length < 2) {
            // Root path, simpler handled
            router.push(`/${newLang}`)
            return
        }
        segments[1] = newLang
        const newPath = segments.join('/')
        try { document.cookie = `NEXT_LOCALE=${newLang}; path=/; max-age=${60*60*24*365}` } catch (e) {}
        router.push(newPath)
    }

    return (
        <select
            value={currentLang}
            onChange={(e) => handleSwitch(e.target.value)}
            className="bg-background/50 text-xs text-foreground border border-border rounded-full px-3 py-1.5 focus:outline-none focus:border-primary cursor-pointer hover:bg-muted/50 transition-colors"
        >
            {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code} className="bg-background text-foreground">
                    {lang.flag} {lang.name}
                </option>
            ))}
        </select>
    )
}
