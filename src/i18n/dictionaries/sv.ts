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
        title3: "Långa videor",
        desc3: "Skapa långa videor—filmer, serier eller TV‑program—uppdelade i scener och sammansatta till en enda nedladdningsbar MP4."
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
    },
    contactPage:     {
            "title":"Kontakta oss",
            "subtitle":"Frågor, feedback eller förfrågningar?",
            "name":"Namn",
            "subject":"Ämne",
            "email":"E‑post",
            "message":"Meddelande",
            "send":"Skicka meddelande",
            "namePh":"Max 25 tecken",
            "subjectPh":"Max 20 tecken",
            "emailPh":"du@exempel.com",
            "messagePh":"Hur kan vi hjälpa? (Max 250 tecken)",
            "max250":"Max 250 tecken",
            "sentToast":"Meddelandet skickades! Vi återkommer snart."
    }
,
    profilePage:     {
            "titleRecent":"Senaste aktivitet",
            "tokenBalance":"Token‑saldo",
            "available":"Tillgängligt för debatter",
            "totalDebates":"Totalt antal debatter",
            "sessions":"Orkestrerade sessioner",
            "noDebates":"Inga debatter hittades. Starta din första session!",
            "anonymous":"Anonym användare",
            "banned":"AVSTÄNGD"
    }

,
  "debateSettingsPage": {
    "title": "Kontoinställningar",
    "subtitle": "Hantera din profil och dina inställningar.",
    "profileInfo": "Profilinformation",
    "emailAddress": "E-postadress",
    "displayName": "Visningsnamn",
    "security": "Säkerhet",
    "changePassword": "Ändra lösenord",
    "dangerZone": "Riskzon",
    "dangerText": "När du raderar kontot går det inte att ångra.",
    "deleteAccount": "Radera konto",
    "emailPlaceholder": "user@example.com",
    "displayNamePlaceholder": "Jarnazi-användare"
  },
  "pricingPage": {
    "investIn": "Investera i",
    "intelligence": "Intelligens",
    "currentPlan": "Nuvarande plan",
    "availableBalance": "Tillgängligt saldo",
    "tokensLabel": "Tokens",
    "planSuffix": "Plan",
    "freeTier": "Gratis",
    "mostPopular": "Mest populär",
    "perPack": "/ paket",
    "descriptionLine1": "Köp tokens för AI-debatter och innehållsgenerering.",
    "tokensNeverExpire": "Tokens går aldrig ut",
    "descriptionLine2": "och kan fyllas på direkt.",
    "enterpriseTitle": "Enterprise-lösning",
    "enterpriseSubtitle": "Köp en anpassad mängd tokens för din organisation.",
    "tokenAmount": "Token-mängd",
    "totalPrice": "Totalpris",
    "enterpriseCustomLabel": "Enterprise Custom ({tokens} Tokens)",
    "plans": {
      "starter": {
        "name": "Starter Pack",
        "description": "Perfekt för avslappnade debatter och ibland frågor.",
        "features": [
          "42 konsensus-tokens",
          "Tillgång till GPT-4o & Claude 3",
          "Grundläggande bildgenerering",
          "Tokens går aldrig ut",
          "E-postsammanfattningar"
        ]
      },
      "producer": {
        "name": "Producer Plan",
        "description": "För power users med frekvent AI-samarbete.",
        "features": [
          "155 konsensus-tokens",
          "Tillgång till alla noder",
          "Högupplöst bildgenerering",
          "Prioriterad bearbetning",
          "Tokens går aldrig ut"
        ]
      },
      "creator": {
        "name": "Pro Creator",
        "description": "Ultimat verktyg för professionell skapande.",
        "features": [
          "1050 konsensus-tokens",
          "Högsta prioritet (Tier 1)",
          "4K-videogenerering",
          "Dedikerad support",
          "Kommersiella rättigheter",
          "Tokens går aldrig ut"
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
    },
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

export default sv;
