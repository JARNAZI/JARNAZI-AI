import { SITE_NAME } from '../config';
export default {
    common: {
        siteName: SITE_NAME,
        login: "Einloggen",
        register: "Registrieren",
        logout: "Abmelden",
        dashboard: "Dashboard",
        settings: "Einstellungen",
        profile: "Profil",
        loading: "Laden...",
        error: "Ein Fehler ist aufgetreten",
        save: "Speichern",
        cancel: "Abbrechen",
        delete: "Löschen",
        back: "Zurück"
    },
    home: {
        heroTitle: "Debattieren. Einigen. Erschaffen.",
        heroSubtitle: "Einmal fragen. Mehrere AIs antworten unabhängig, prüfen sich gegenseitig, dann führt OpenAI zu einem finalen Konsens — bereit für Bilder, Video, Audio oder Code.",
        startDebate: "Debatte starten",
        howItWorks: "Wie es funktioniert"
    },
    debate: {
        currentPlan: 'Current plan',
        newTitle: "Neue Debatte",
        topicLabel: "Geben Sie ein Thema ein...",
        startBtn: "Debatte initiieren",
        analyzing: "Thema analysieren...",
        consensusTitle: "Endgültiger Konsens",
        // Konsole UI
        consoleTitle: "Jarnazi Konsole",
        online: "ONLINE",
        text: "Text",
        latex: "LaTex",
        file: "Datei",
        image: "Bild",
        video: "Video",
        audio: "Audio",
        print: "Drucken",
        copy: "Kopieren",
        save: "Speichern",
        download: "Herunterladen",
        placeholder: "Geben Sie Ihr Argument ein...",
        mathPlaceholder: "\\sum_{i=0}^n x_i",
        menu: "Systemmenü",
        copyJson: "JSON kopieren",
        printTranscript: "Transkript drucken",
        viewPlans: "Modelle ansehen",
        editProfile: "Profil bearbeiten",
        contactUs: "Kontaktieren Sie uns",
        sessionHistory: "Sitzungsverlauf",
        language: "Sprache",
        darkMode: "Dunkelmodus",
        lightMode: "Lichtmodus",
        deleteAccount: "Konto löschen"
    },
    notifications: {
        welcome: "Willkommen beim Jarnazi-Konsens. Der Rat ist bereit."
    },
    nav: {
        features: "Funktionen",
        pricing: "Preise",
        contact: "Kontakt"
    },
    sidebar: {
        newSession: "Neue Sitzung",
        plans: "Pläne",
        settings: "Einstellungen",
        signOut: "Abmelden",
        jarnazi: "JARNAZI",
        consensus: "KONSENS"
    },
    features: {
        title1: "Multi-Agent-Debatte",
        desc1: "Warum nur ein Modell? Erhalte unabhängige Perspektiven mehrerer AIs, die sich gegenseitig prüfen, um Halluzinationen zu reduzieren.",
        title2: "Konsens → Kreation",
        desc2: "Wandle die finale Einigung in einen einzigen hochwertigen Plan und Prompt für Bild-, Video-, Audio- oder Code-Generierung.",
        title3: "Bewusst kurzlebig",
        desc3: "Sitzungen und generierte Inhalte verfallen automatisch nach 3 Tagen. Du behältst die Kontrolle."
    },
    footer: {
        privacy: "Datenschutzrichtlinie",
        terms: "Nutzungsbedingungen",
        rights: "Alle Rechte vorbehalten."
    },
    auth: {
        welcome: "Willkommen zurück",
        subtitle: "Melden Sie sich an, um die Debatte zu orchestrieren.",
        email: "E-Mail-Adresse",
        password: "Passwort",
        signIn: "Anmelden",
        noAccount: "Haben Sie noch kein Konto?",
        createProfile: "Profil erstellen",
        securityCheck: "Bitte führen Sie die Sicherheitsprüfung durch."
    },
    landing: {
        badge: "Die Zukunft der Konsensintelligenz",
        subtitle2: "AI-Konsens-Studio"
    }
} as const;

