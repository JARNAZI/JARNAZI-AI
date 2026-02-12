import { SITE_NAME } from '../config';
const de = {
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
    heroTitle: "KI-Konsens — Klarheit durch kollektive Intelligenz.",
    heroSubtitle: "Fragen Sie einmal. Mehrere KIs bewerten, hinterfragen und verfeinern — dann erhalten Sie einen klaren KI-Konsens.",
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
    title3: "Lange Videos möglich",
    desc3: "Erstelle lange Videos – Filme, Serien oder TV‑Shows – in Szenen aufgeteilt und zu einer einzigen MP4 zum Download zusammengesetzt."
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
  howItWorks: {
    title: "Wie es funktioniert",
    step1Title: "Multi-Agent-Debatte",
    step1Desc: "Beziehen Sie mehrere KI-Modelle in eine strukturierte Beratung ein, um die genauesten und kreativsten Ergebnisse zu erzielen.",
    step2Title: "Konsensbildung",
    step2Desc: "Fortschrittliche Orchestrierungsebene synthetisiert unabh�ngige Modellausgaben zu einem einheitlichen Konsens.",
    step3Title: "Asset-Generierung",
    step3Desc: "Generieren Sie professionelle Bilder, Videos und Audio basierend auf dem erarbeiteten Konsens.",
    step4Title: "Langform-Video (Filme & Serien)",
    step4Desc: "Erstellen Sie lange Videos�Filme, Serienepisoden oder TV-Programme. Wir k�nnen Ihre Idee in Szenen aufteilen, Segmente erstellen und dann eine einzelne MP4 zusammenstellen, die Sie ansehen und herunterladen k�nnen."
  },
  landing: {
    badge: "Die Zukunft der Konsensintelligenz",
    subtitle2: "AI-Konsens-Studio"
  },
  dashboard: {
    neuralHub: "Neural Hub",
    underConstruction: "Dieses Modul befindet sich derzeit im Aufbau. Der Neural Hub wird als zentrale Orchestrierungsebene f�r fortgeschrittene Multi-Agenten-Workflows dienen.",
    returnToConsole: "Zur�ck zur Konsole"
  },
  contactPage: {
    "title": "Kontakt",
    "subtitle": "Fragen, Feedback oder Anfragen?",
    "name": "Name",
    "subject": "Betreff",
    "email": "E-Mail",
    "message": "Nachricht",
    "send": "Nachricht senden",
    "namePh": "Max. 25 Zeichen",
    "subjectPh": "Max. 20 Zeichen",
    "emailPh": "du@beispiel.com",
    "messagePh": "Wie können wir helfen? (Max. 250 Zeichen)",
    "max250": "Maximal 250 Zeichen",
    "sentToast": "Nachricht erfolgreich gesendet! Wir melden uns in Kürze."
  }
  ,
  profilePage: {
    "titleRecent": "Letzte Aktivitäten",
    "tokenBalance": "Token-Guthaben",
    "available": "Verfügbar für Debatten",
    "totalDebates": "Debatten insgesamt",
    "sessions": "Orchestrierte Sitzungen",
    "noDebates": "Keine Debatten gefunden. Starte deine erste Sitzung!",
    "anonymous": "Anonymer Nutzer",
    "banned": "GESPERRT"
  }

  ,
  "debateSettingsPage": {
    "title": "Kontoeinstellungen",
    "subtitle": "Verwalte dein Profil und deine Einstellungen.",
    "profileInfo": "Profilinformationen",
    "emailAddress": "E-Mail-Adresse",
    "displayName": "Anzeigename",
    "security": "Sicherheit",
    "changePassword": "Passwort ändern",
    "dangerZone": "Gefahrenzone",
    "dangerText": "Sobald du dein Konto löschst, gibt es kein Zurück.",
    "deleteAccount": "Konto löschen",
    "emailPlaceholder": "user@example.com",
    "displayNamePlaceholder": "Jarnazi Nutzer"
  },
  "pricingPage": {
    "investIn": "Investiere in",
    "intelligence": "Intelligenz",
    "currentPlan": "Aktueller Plan",
    "availableBalance": "Verfügbares Guthaben",
    "tokensLabel": "Tokens",
    "planSuffix": "Plan",
    "freeTier": "Kostenlos",
    "mostPopular": "Am beliebtesten",
    "perPack": "/ Paket",
    "descriptionLine1": "Kaufe Tokens für KI-Debatten und Content-Erstellung.",
    "tokensNeverExpire": "Tokens verfallen nie",
    "descriptionLine2": "und können sofort aufgeladen werden.",
    "enterpriseTitle": "Enterprise-Lösung",
    "enterpriseSubtitle": "Kaufe eine benutzerdefinierte Token-Menge für dein Unternehmen.",
    "tokenAmount": "Token-Anzahl",
    "totalPrice": "Gesamtpreis",
    "enterpriseCustomLabel": "Enterprise Custom ({tokens} Tokens)",
    "plans": {
      "starter": {
        "name": "Starter-Paket",
        "description": "Perfekt für gelegentliche Debatten und Anfragen.",
        "features": [
          "42 Konsens-Tokens",
          "Zugang zu GPT-4o & Claude 3",
          "Einfache Bildgenerierung",
          "Tokens verfallen nie",
          "E-Mail-Zusammenfassungen"
        ]
      },
      "producer": {
        "name": "Producer-Plan",
        "description": "Für Power-User mit häufiger KI-Kollaboration.",
        "features": [
          "155 Konsens-Tokens",
          "Zugang zu allen Neural Nodes",
          "Hochauflösende Bildgenerierung",
          "Priorisierte Verarbeitung",
          "Tokens verfallen nie"
        ]
      },
      "creator": {
        "name": "Pro Creator",
        "description": "Ultimatives Toolkit für professionelle Content-Erstellung.",
        "features": [
          "1050 Konsens-Tokens",
          "Top-Priorität (Tier 1)",
          "4K-Video-Generierung",
          "Dedizierter Support",
          "Kommerzielle Nutzungsrechte",
          "Tokens verfallen nie"
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


  adminCosts: {

    title: 'AI Cost Rates',

    subtitle: 'Manage per-unit USD rates used by the pricing engine (75% cost / 25% margin).'

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

export default de;



