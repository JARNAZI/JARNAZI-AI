export const LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
] as const;

export type LanguageCode = typeof LANGUAGES[number]['code'];
export const DEFAULT_LANGUAGE: LanguageCode = 'en';

export const AI_NAMES = {
    Orchestrator: "Orchestrator",
    Debater: "Debater",
    Analyst: "Analyst"
};

export const SITE_NAME = "Jarnazi AI Consensus";
