import { SITE_NAME } from '../config';
const fr = {
common: {
        siteName: SITE_NAME,
        login: "Se connecter",
        register: "S'inscrire",
        logout: "DÃ©connexion",
        dashboard: "Tableau de bord",
        settings: "ParamÃ¨tres",
        profile: "Profil",
        loading: "Chargement...",
        error: "Une erreur est survenue",
        save: "Enregistrer",
        cancel: "Annuler",
        delete: "Supprimer",
        back: "Retour"
    },
    home: {
        heroTitle: "DÃ©bat. Accord. CrÃ©ation.",
        heroSubtitle: "Posez une question. Plusieurs IA rÃ©pondent indÃ©pendamment, se relisent entre elles, puis OpenAI conduit Ã  un consensus final â€” prÃªt pour image, vidÃ©o, audio ou code.",
        startDebate: "Commencer le dÃ©bat",
        howItWorks: "Comment Ã§a marche"
    },
    debate: {
        currentPlan: 'Current plan',
        newTitle: "Nouveau dÃ©bat",
        topicLabel: "Entrez un sujet...",
        startBtn: "Lancer le dÃ©bat",
        analyzing: "Analyse du sujet...",
        consensusTitle: "Consensus final",
        // Console UI
        consoleTitle: "Console Jarnazi",
        online: "EN LIGNE",
        text: "Texte",
        latex: "LaTex",
        file: "Fichier",
        image: "Image",
        video: "VidÃ©o",
        audio: "Audio",
        print: "Imprimer",
        copy: "Copier",
        save: "Sauvegarder",
        download: "TÃ©lÃ©charger",
        placeholder: "Entrez votre argument...",
        mathPlaceholder: "\\sum_{i=0}^n x_i",
        menu: "Menu SystÃ¨me",
        copyJson: "Copier JSON",
        printTranscript: "Imprimer la transcription",
        viewPlans: "Voir les plans",
        editProfile: "Modifier le profil",
        contactUs: "Contactez-nous",
        sessionHistory: "Historique des sessions",
        language: "Langue",
        darkMode: "Mode sombre",
        lightMode: "Mode clair",
        deleteAccount: "Supprimer le compte"
    },
    notifications: {
        welcome: "Bienvenue au Consensus Jarnazi. Le Conseil est prÃªt."
    },
    nav: {
        features: "FonctionnalitÃ©s",
        pricing: "Tarifs",
        contact: "Contactez-nous"
    },
    sidebar: {
        newSession: "Nouvelle session",
        plans: "Plans",
        settings: "ParamÃ¨tres",
        signOut: "DÃ©connexion",
        jarnazi: "JARNAZI",
        consensus: "CONSENSUS"
    },
    features: {
        title1: "DÃ©bat multi-agents",
        desc1: "Pourquoi nâ€™utiliser quâ€™un seul modÃ¨le ? Obtenez des points de vue indÃ©pendants de plusieurs IA, avec revue croisÃ©e pour rÃ©duire les hallucinations.",
        title2: "Consensus â†’ CrÃ©ation",
        desc2: "Transformez lâ€™accord final en un plan et un prompt uniques, de haute qualitÃ©, pour gÃ©nÃ©rer image, vidÃ©o, audio ou code.",
        title3: "VidÃ©o longue durÃ©e",
        desc3: "GÃ©nÃ©rez des vidÃ©os longuesâ€”films, sÃ©ries ou Ã©missions TVâ€”dÃ©coupÃ©es en scÃ¨nes puis assemblÃ©es en un seul MP4 tÃ©lÃ©chargeable."
    },
    footer: {
        privacy: "Politique de confidentialitÃ©",
        terms: "Conditions d'utilisation",
        rights: "Tous droits rÃ©servÃ©s."
    },
    auth: {
        welcome: "Bon retour",
        subtitle: "Connectez-vous pour orchestrer le dÃ©bat.",
        email: "Adresse e-mail",
        password: "Mot de passe",
        signIn: "Se connecter",
        noAccount: "Pas de compte ?",
        createProfile: "CrÃ©er un profil",
        securityCheck: "Veuillez complÃ©ter le test de sÃ©curitÃ©."
    },
    landing: {
        badge: "L'avenir de l'intelligence consensuelle",
        subtitle2: "Studio de Consensus IA"
    },
    contactPage:     {
            "title":"Nous contacter",
            "subtitle":"Questions, retours ou demandes ?",
            "name":"Nom",
            "subject":"Sujet",
            "email":"E-mail",
            "message":"Message",
            "send":"Envoyer",
            "namePh":"Max 25 caractÃ¨res",
            "subjectPh":"Max 20 caractÃ¨res",
            "emailPh":"vous@exemple.com",
            "messagePh":"Comment pouvons-nous aider ? (Max 250 caractÃ¨res)",
            "max250":"Maximum 250 caractÃ¨res",
            "sentToast":"Message envoyÃ© ! Nous vous rÃ©pondrons rapidement."
    }
,
    profilePage:     {
            "titleRecent":"ActivitÃ© rÃ©cente",
            "tokenBalance":"Solde de jetons",
            "available":"Disponible pour les dÃ©bats",
            "totalDebates":"DÃ©bats au total",
            "sessions":"Sessions orchestrÃ©es",
            "noDebates":"Aucun dÃ©bat trouvÃ©. Lancez votre premiÃ¨re session !",
            "anonymous":"Utilisateur anonyme",
            "banned":"BANNI"
    }

,
  "debateSettingsPage": {
    "title": "ParamÃ¨tres du compte",
    "subtitle": "GÃ©rez votre profil et vos prÃ©fÃ©rences.",
    "profileInfo": "Informations du profil",
    "emailAddress": "Adresse e-mail",
    "displayName": "Nom dâ€™affichage",
    "security": "SÃ©curitÃ©",
    "changePassword": "Changer le mot de passe",
    "dangerZone": "Zone de danger",
    "dangerText": "Une fois votre compte supprimÃ©, il nâ€™y a pas de retour en arriÃ¨re.",
    "deleteAccount": "Supprimer le compte",
    "emailPlaceholder": "user@example.com",
    "displayNamePlaceholder": "Utilisateur Jarnazi"
  },
  "pricingPage": {
    "investIn": "Investissez dans",
    "intelligence": "lâ€™intelligence",
    "currentPlan": "Forfait actuel",
    "availableBalance": "Solde disponible",
    "tokensLabel": "Tokens",
    "planSuffix": "Forfait",
    "freeTier": "Gratuit",
    "mostPopular": "Le plus populaire",
    "perPack": "/ pack",
    "descriptionLine1": "Achetez des tokens pour alimenter vos dÃ©bats IA et la gÃ©nÃ©ration de contenu.",
    "tokensNeverExpire": "Les tokens nâ€™expirent jamais",
    "descriptionLine2": "et peuvent Ãªtre rechargÃ©s instantanÃ©ment.",
    "enterpriseTitle": "Solution Enterprise",
    "enterpriseSubtitle": "Achetez une quantitÃ© personnalisÃ©e de tokens pour votre organisation.",
    "tokenAmount": "QuantitÃ© de tokens",
    "totalPrice": "Prix total",
    "enterpriseCustomLabel": "Enterprise Custom ({tokens} Tokens)",
    "plans": {
      "starter": {
        "name": "Pack Starter",
        "description": "IdÃ©al pour des dÃ©bats occasionnels.",
        "features": [
          "42 tokens de consensus",
          "AccÃ¨s Ã  GPT-4o & Claude 3",
          "GÃ©nÃ©ration dâ€™images basique",
          "Les tokens nâ€™expirent jamais",
          "RÃ©sumÃ©s par e-mail"
        ]
      },
      "producer": {
        "name": "Forfait Producer",
        "description": "Pour les utilisateurs intensifs et la collaboration frÃ©quente.",
        "features": [
          "155 tokens de consensus",
          "AccÃ¨s Ã  tous les nÅ“uds",
          "Images haute rÃ©solution",
          "Traitement prioritaire",
          "Les tokens nâ€™expirent jamais"
        ]
      },
      "creator": {
        "name": "Pro Creator",
        "description": "BoÃ®te Ã  outils ultime pour la crÃ©ation pro.",
        "features": [
          "1050 tokens de consensus",
          "AccÃ¨s prioritaire (Tier 1)",
          "GÃ©nÃ©ration vidÃ©o 4K",
          "Support dÃ©diÃ©",
          "Droits dâ€™usage commercial",
          "Les tokens nâ€™expirent jamais"
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

export default fr;



