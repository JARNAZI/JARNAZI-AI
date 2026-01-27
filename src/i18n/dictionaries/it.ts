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
        title3: "Video lunghi",
        desc3: "Genera video lunghi—film, serie o programmi TV—divisi in scene e composti in un unico MP4 scaricabile."
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
    },
    contactPage:     {
            "title":"Contattaci",
            "subtitle":"Domande, feedback o richieste?",
            "name":"Nome",
            "subject":"Oggetto",
            "email":"Email",
            "message":"Messaggio",
            "send":"Invia messaggio",
            "namePh":"Max 25 caratteri",
            "subjectPh":"Max 20 caratteri",
            "emailPh":"tuo@esempio.com",
            "messagePh":"Come possiamo aiutarti? (Max 250 caratteri)",
            "max250":"Massimo 250 caratteri",
            "sentToast":"Messaggio inviato! Ti risponderemo a breve."
    }
,
    profilePage:     {
            "titleRecent":"Attività recente",
            "tokenBalance":"Saldo token",
            "available":"Disponibile per i dibattiti",
            "totalDebates":"Dibattiti totali",
            "sessions":"Sessioni orchestrate",
            "noDebates":"Nessun dibattito trovato. Inizia la tua prima sessione!",
            "anonymous":"Utente anonimo",
            "banned":"BANNATO"
    }

,
  "debateSettingsPage": {
    "title": "Impostazioni account",
    "subtitle": "Gestisci profilo e preferenze.",
    "profileInfo": "Informazioni profilo",
    "emailAddress": "Email",
    "displayName": "Nome visualizzato",
    "security": "Sicurezza",
    "changePassword": "Cambia password",
    "dangerZone": "Zona pericolosa",
    "dangerText": "Una volta eliminato l’account, non si torna indietro.",
    "deleteAccount": "Elimina account",
    "emailPlaceholder": "user@example.com",
    "displayNamePlaceholder": "Utente Jarnazi"
  },
  "pricingPage": {
    "investIn": "Investi in",
    "intelligence": "Intelligenza",
    "currentPlan": "Piano attuale",
    "availableBalance": "Saldo disponibile",
    "tokensLabel": "Token",
    "planSuffix": "Piano",
    "freeTier": "Gratis",
    "mostPopular": "Più popolare",
    "perPack": "/ pacchetto",
    "descriptionLine1": "Acquista token per alimentare i tuoi dibattiti IA e la generazione di contenuti.",
    "tokensNeverExpire": "I token non scadono mai",
    "descriptionLine2": "e puoi ricaricarli subito.",
    "enterpriseTitle": "Soluzione Enterprise",
    "enterpriseSubtitle": "Acquista una quantità personalizzata di token per la tua organizzazione.",
    "tokenAmount": "Quantità di token",
    "totalPrice": "Prezzo totale",
    "enterpriseCustomLabel": "Enterprise Custom ({tokens} Token)",
    "plans": {
      "starter": {
        "name": "Starter Pack",
        "description": "Perfetto per dibattiti occasionali e richieste sporadiche.",
        "features": [
          "42 token di consenso",
          "Accesso a GPT-4o & Claude 3",
          "Generazione immagini base",
          "I token non scadono mai",
          "Riepiloghi email"
        ]
      },
      "producer": {
        "name": "Producer Plan",
        "description": "Per utenti avanzati con collaborazione frequente.",
        "features": [
          "155 token di consenso",
          "Accesso a tutti i nodi",
          "Immagini ad alta risoluzione",
          "Elaborazione prioritaria",
          "I token non scadono mai"
        ]
      },
      "creator": {
        "name": "Pro Creator",
        "description": "Toolkit definitivo per contenuti professionali.",
        "features": [
          "1050 token di consenso",
          "Accesso prioritario (Tier 1)",
          "Generazione video 4K",
          "Supporto dedicato",
          "Diritti uso commerciale",
          "I token non scadono mai"
        ]
      }
    }
  }
,
    debateMenu: {
        menuTitle: "Menu",
        tierLabel: "Tier",
        balanceLabel: "Balance",
        neuralHub: "Neural Hub",
        myTokens: "My Tokens",
        editUserData: "Edit User Data",
        savedAssets: "Saved Assets",
        pricing: "Pricing",
        purchaseCredits: "Purchase Credits",
        systemLabel: "System",
        lightSpectrum: "Light Spectrum",
        darkSpectrum: "Dark Spectrum",
        languageLabel: "Language",
        contactSupport: "Contact Support"
    },

    updatePasswordPage: {
        title: "Set New Password",
        subtitle: "Please enter your new secure password.",
        newPassword: "New Password",
        submit: "Update Password",
        successTitle: "Password Updated",
        successMessage: "Redirecting you to login...",
        toastSuccess: "Password updated successfully!"
    },
    adminDashboard: {
        title: "Super Admin Console",
        cards: {
            providersTitle: "Plans",
            providersDesc: "Manage subscription plans",
            usersTitle: "User Management",
            usersDesc: "Control access & tokens",
            apiStatusTitle: "API Status",
            apiStatusDesc: "Check API configuration",
            financialsTitle: "Financials",
            financialsDesc: "Revenue & subscriptions",
            healthTitle: "System Health",
            healthDesc: "Server status & logs",
            settingsTitle: "Site Settings",
            settingsDesc: "Privacy, Terms & Branding"
        }
    },


    adminProviders: {
      title: "AI Providers",
      subtitle: "Configure models and priorities available to the Orchestrator.",
      providersHeading: "Providers",
      addProvider: "Add Provider",
      editProvider: "Edit Provider",
      confirmDeleteProvider: "Delete this provider?",
      providerSaved: "Provider saved",
      providerDeleted: "Provider deleted",
      fieldName: "Name",
      fieldProviderCode: "Provider Code",
      fieldCategory: "Category",
      fieldModelId: "Model ID",
      fieldEnvKey: "Env Key (Edge Secret Name)",
      fieldBaseUrl: "Base URL (optional)",
      fieldPriority: "Priority (lower = earlier)",
      fieldActive: "Active",
      fieldConfig: "Config (JSON)",
      save: "Save",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete"
    },

    adminUsers: {
      title: "User Management",
      searchPlaceholder: "Search by name or email...",
      searchButton: "Search Users",
      thUser: "User",
      thRole: "Role",
      thTokens: "Tokens",
      thStatus: "Status",
      thActions: "Actions",
      noName: "No Name",
      noEmail: "No Email",
      active: "Active",
      banned: "Banned",
      createStaff: "Create Staff",
      createStaffTitle: "Create Support Staff",
      staffCreated: "Staff user created/updated successfully",
      staffEmailPlaceholder: "staff@company.com",
      staffNamePlaceholder: "Full name",
      staffPasswordPlaceholder: "Temporary password",
      createOrUpdateStaff: "Create / Update Staff",
      cancel: "Cancel",
      deleteConfirm: "Type \"DELETE\" to confirm deleting {email} forever.",
      userDeleted: "User deleted",
      settings: "Settings",
      delete: "Delete"
    },

    adminModels: {
      title: "Model Registry",
      subtitle: "Only enabled models here can be used by the Orchestrator. Add or disable models without code changes.",
      modelsHeading: "Models",
      addModel: "Add Model",
      editModel: "Edit Model",
      confirmDeleteModel: "Delete this model?",
      modelSaved: "Model saved",
      modelDeleted: "Model deleted",
      fieldProvider: "Provider",
      fieldModelId: "Model ID",
      fieldPriority: "Priority",
      fieldEnabled: "Enabled",
      fieldNotes: "Notes",
      fieldCapabilities: "Capabilities (JSON)",
      fieldCostProfile: "Cost Profile (JSON)",
      save: "Save",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete"
    },

    adminMessages: {
      title: "Inbox",
      loadError: "Error loading messages:",
      empty: "No messages yet.",
      replied: "Replied",
      reply: "Reply",
      sendReply: "Send Reply",
      replyPlaceholder: "Type your reply...",
      replySent: "Reply sent successfully",
      replyFailed: "Failed to send reply",
      cancel: "Cancel",
      send: "Send"
    },,
  buyTokensPage: {
    backToConsole: "Back to Console",
    title: "Buy Tokens",
    subtitle: "Purchase credits to unlock premium tools.",
    amountLabel: "Amount (USD)",
    minHelper: "Minimum purchase: ${MIN_PURCHASE_AMOUNT_USD}",
    youWillReceive: "You will receive",
    tokens: "Tokens",
    payAddTokens: "Pay & Add Tokens",
    stripeDisabled: "Stripe payments are currently disabled.",
    payWithCrypto: "Pay with Crypto"
  }
} as const;

export default it;
