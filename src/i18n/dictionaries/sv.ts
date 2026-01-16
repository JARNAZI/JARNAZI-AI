import { SITE_NAME } from '../config';
const sv = {
common: {
        siteName: SITE_NAME,
        login: "Logga in",
        register: "Registrera dig",
        logout: "Logga ut",
        dashboard: "Panel",
        settings: "Inställningar",
        profile: "Profil",
        loading: "Laddar...",
        error: "Ett fel inträffade",
        save: "Spara",
        cancel: "Avbryt",
        delete: "Ta bort",
        back: "Tillbaka"
    },
    home: {
        heroTitle: "Debatt. Enighet. Skapa.",
        heroSubtitle: "Fråga en gång. Flera AI:er svarar oberoende, granskar varandra och sedan leder OpenAI fram till en slutlig konsensus — redo för bild, video, ljud eller kod.",
        startDebate: "Starta Debatt",
        howItWorks: "Hur det fungerar"
    },
    debate: {
        currentPlan: 'Current plan',
        newTitle: "Ny Debatt",
        topicLabel: "Ange ett ämne...",
        startBtn: "Starta Debatt",
        analyzing: "Analyserar Ämne...",
        consensusTitle: "Slutlig Konsensus",
        // Konsol UI
        consoleTitle: "Jarnazi Konsol",
        online: "ONLINE",
        text: "Text",
        latex: "LaTex",
        file: "Fil",
        image: "Bild",
        video: "Video",
        audio: "Ljud",
        print: "Skriv ut",
        copy: "Kopiera",
        save: "Spara",
        download: "Ladda ner",
        placeholder: "Ange ditt argument...",
        mathPlaceholder: "\\sum_{i=0}^n x_i",
        menu: "Systemmeny",
        copyJson: "Kopiera JSON",
        printTranscript: "Skriv ut Transkript",
        viewPlans: "Visa planer",
        editProfile: "Redigera profil",
        contactUs: "Kontakta oss",
        sessionHistory: "Sessionshistorik",
        language: "Språk",
        darkMode: "Mörkt läge",
        lightMode: "Ljust läge",
        deleteAccount: "Ta bort konto"
    },
    notifications: {
        welcome: "Välkommen till Jarnazi Consensus. Rådet är redo."
    },
    nav: {
        features: "Funktioner",
        pricing: "Priser",
        contact: "Kontakta Oss"
    },
    sidebar: {
        newSession: "Ny session",
        plans: "Planer",
        settings: "Inställningar",
        signOut: "Logga ut",
        jarnazi: "JARNAZI",
        consensus: "KONSENSUS"
    },
    features: {
        title1: "Multi-agent-debatt",
        desc1: "Varför lita på en modell? Få oberoende perspektiv från flera AI:er, korsgranskade för att minska hallucinationer.",
        title2: "Konsensus → Skapande",
        desc2: "Gör den slutliga enigheten till en enda plan och prompt av hög kvalitet för bild-, video-, ljud- eller kodgenerering.",
        title3: "Designad att försvinna",
        desc3: "Sessioner och genererade tillgångar förfaller automatiskt efter 3 dagar. Du har kontrollen."
    },
    footer: {
        privacy: "Integritetspolicy",
        terms: "Användarvillkor",
        rights: "Alla rättigheter förbehållna."
    },
    auth: {
        welcome: "Välkommen tillbaka",
        subtitle: "Logga in för att orkestrera debatten.",
        email: "E-postadress",
        password: "Lösenord",
        signIn: "Logga in",
        noAccount: "Har du inget konto?",
        createProfile: "Skapa profil",
        securityCheck: "Vänligen slutför säkerhetskontrollen."
    },
    landing: {
        badge: "Framtiden för konsensusintelligens",
        subtitle2: "AI-konsensusstudio"
    }
} as const;

export default sv;
