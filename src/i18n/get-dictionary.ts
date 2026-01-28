import 'server-only'
import type { LanguageCode } from './config'

const dictionaries = {
    en: () => import('./dictionaries/en').then((module) => module.default),
    es: () => import('./dictionaries/es').then((module) => module.default),
    pt: () => import('./dictionaries/pt').then((module) => module.default),
    de: () => import('./dictionaries/de').then((module) => module.default),
    it: () => import('./dictionaries/it').then((module) => module.default),
    ja: () => import('./dictionaries/ja').then((module) => module.default),
    ar: () => import('./dictionaries/ar').then((module) => module.default),
    fr: () => import('./dictionaries/fr').then((module) => module.default),
    sv: () => import('./dictionaries/sv').then((module) => module.default),
}

export const getDictionary = async (locale: any) => {
    const fn = dictionaries[locale];
    if (fn) {
        return fn();
    }
    // Fallback to English if locale not found
    return dictionaries.en();
}
