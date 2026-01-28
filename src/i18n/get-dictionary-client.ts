import type { LanguageCode } from './config'

const dictionaries = {
  en: () => import('./dictionaries/en').then((m) => m.default),
  es: () => import('./dictionaries/es').then((m) => m.default),
  pt: () => import('./dictionaries/pt').then((m) => m.default),
  de: () => import('./dictionaries/de').then((m) => m.default),
  it: () => import('./dictionaries/it').then((m) => m.default),
  ja: () => import('./dictionaries/ja').then((m) => m.default),
  ar: () => import('./dictionaries/ar').then((m) => m.default),
  fr: () => import('./dictionaries/fr').then((m) => m.default),
  sv: () => import('./dictionaries/sv').then((m) => m.default),
} as const;

export async function getDictionaryClient(locale: any) {
  const fn = (dictionaries as any)[locale];
  if (fn) return fn();
  return dictionaries.en();
}
