import { SITE_NAME } from '../config';
const it = {
common: {
        siteName: SITE_NAME,
        login: "Accedi",
        register: "Registrati",
        logout: "Esci",
        dashboard: "Dashboard",
        settings: "Impostazioni",
        profile: "Profilo",
        loading: "Caricamento...",
        error: "Si è verificato un errore",
        save: "Salva",
        cancel: "Annulla",
        delete: "Elimina",
        back: "Indietro"
    },
    home: {
        heroTitle: "Dibattito. Accordo. Creazione.",
        heroSubtitle: "Chiedi una volta. Più IA rispondono in modo indipendente, si revisionano a vicenda, poi OpenAI guida un consenso finale — pronto per immagini, video, audio o codice.",
        startDebate: "Inizia Dibattito",
        howItWorks: "Come funziona"
    },
    debate: {
        currentPlan: 'Current plan',
        newTitle: "Nuovo Dibattito",
        topicLabel: "Inserisci un argomento...",
        startBtn: "Avvia Dibattito",
        analyzing: "Analisi dell'argomento...",
        consensusTitle: "Consenso Finale",
        // Console UI
        consoleTitle: "Console Jarnazi",
        online: "ONLINE",
        text: "Testo",
        latex: "LaTex",
        file: "File",
        image: "Immagine",
        video: "Video",
        audio: "Audio",
        print: "Stampa",
        copy: "Copia",
        save: "Salva",
        download: "Scarica",
        placeholder: "Inserisci il tuo argomento...",
        mathPlaceholder: "\\sum_{i=0}^n x_i",
        menu: "Menu di Sistema",
        copyJson: "Copia JSON",
        printTranscript: "Stampa Trascrizione",
        viewPlans: "Visualizza Piani",
        editProfile: "Modifica Profilo",
        contactUs: "Contattaci",
        sessionHistory: "Cronologia Sessioni",
        language: "Lingua",
        darkMode: "Modalità Scura",
        lightMode: "Modalità Chiara",
        deleteAccount: "Elimina Account"
    },
    notifications: {
        welcome: "Benvenuto nel Consenso Jarnazi. Il Consiglio è pronto."
    },
    nav: {
        features: "Funzionalità",
        pricing: "Prezzi",
        contact: "Contattaci"
    },
    sidebar: {
        newSession: "Nuova Sessione",
        plans: "Piani",
        settings: "Impostazioni",
        signOut: "Disconnetti",
        jarnazi: "JARNAZI",
        consensus: "CONSENSO"
    },
    features: {
        title1: "Dibattito multi-agente",
        desc1: "Perché affidarsi a un solo modello? Ottieni prospettive indipendenti da più IA, con revisione incrociata per ridurre le allucinazioni.",
        title2: "Consenso → Creazione",
        desc2: "Trasforma l’accordo finale in un unico piano e prompt di alta qualità per generare immagini, video, audio o codice.",
        title3: "Progettato per scadere",
        desc3: "Sessioni e contenuti generati scadono automaticamente dopo 3 giorni. Sei tu a controllare."
    },
    footer: {
        privacy: "Informativa sulla Privacy",
        terms: "Termini di Utilizzo",
        rights: "Tutti i diritti riservati."
    },
    auth: {
        welcome: "Bentornato",
        subtitle: "Accedi per orchestrare il dibattito.",
        email: "Indirizzo Email",
        password: "Password",
        signIn: "Accedi",
        noAccount: "Non hai un account?",
        createProfile: "Crea Profilo",
        securityCheck: "Si prega di completare il controllo di sicurezza."
    },
    landing: {
        badge: "Il futuro dell'intelligenza del consenso",
        subtitle2: "Studio di Consenso IA"
    }
} as const;

export default it;
