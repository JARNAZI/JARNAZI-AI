import { SITE_NAME } from '../config';
const fr = {
common: {
        siteName: SITE_NAME,
        login: "Se connecter",
        register: "S'inscrire",
        logout: "Déconnexion",
        dashboard: "Tableau de bord",
        settings: "Paramètres",
        profile: "Profil",
        loading: "Chargement...",
        error: "Une erreur est survenue",
        save: "Enregistrer",
        cancel: "Annuler",
        delete: "Supprimer",
        back: "Retour"
    },
    home: {
        heroTitle: "Débat. Accord. Création.",
        heroSubtitle: "Posez une question. Plusieurs IA répondent indépendamment, se relisent entre elles, puis OpenAI conduit à un consensus final — prêt pour image, vidéo, audio ou code.",
        startDebate: "Commencer le débat",
        howItWorks: "Comment ça marche"
    },
    debate: {
        currentPlan: 'Current plan',
        newTitle: "Nouveau débat",
        topicLabel: "Entrez un sujet...",
        startBtn: "Lancer le débat",
        analyzing: "Analyse du sujet...",
        consensusTitle: "Consensus final",
        // Console UI
        consoleTitle: "Console Jarnazi",
        online: "EN LIGNE",
        text: "Texte",
        latex: "LaTex",
        file: "Fichier",
        image: "Image",
        video: "Vidéo",
        audio: "Audio",
        print: "Imprimer",
        copy: "Copier",
        save: "Sauvegarder",
        download: "Télécharger",
        placeholder: "Entrez votre argument...",
        mathPlaceholder: "\\sum_{i=0}^n x_i",
        menu: "Menu Système",
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
        welcome: "Bienvenue au Consensus Jarnazi. Le Conseil est prêt."
    },
    nav: {
        features: "Fonctionnalités",
        pricing: "Tarifs",
        contact: "Contactez-nous"
    },
    sidebar: {
        newSession: "Nouvelle session",
        plans: "Plans",
        settings: "Paramètres",
        signOut: "Déconnexion",
        jarnazi: "JARNAZI",
        consensus: "CONSENSUS"
    },
    features: {
        title1: "Débat multi-agents",
        desc1: "Pourquoi n’utiliser qu’un seul modèle ? Obtenez des points de vue indépendants de plusieurs IA, avec revue croisée pour réduire les hallucinations.",
        title2: "Consensus → Création",
        desc2: "Transformez l’accord final en un plan et un prompt uniques, de haute qualité, pour générer image, vidéo, audio ou code.",
        title3: "Vidéo longue durée",
        desc3: "Générez des vidéos longues—films, séries ou émissions TV—découpées en scènes puis assemblées en un seul MP4 téléchargeable."
    },
    footer: {
        privacy: "Politique de confidentialité",
        terms: "Conditions d'utilisation",
        rights: "Tous droits réservés."
    },
    auth: {
        welcome: "Bon retour",
        subtitle: "Connectez-vous pour orchestrer le débat.",
        email: "Adresse e-mail",
        password: "Mot de passe",
        signIn: "Se connecter",
        noAccount: "Pas de compte ?",
        createProfile: "Créer un profil",
        securityCheck: "Veuillez compléter le test de sécurité."
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
            "namePh":"Max 25 caractères",
            "subjectPh":"Max 20 caractères",
            "emailPh":"vous@exemple.com",
            "messagePh":"Comment pouvons-nous aider ? (Max 250 caractères)",
            "max250":"Maximum 250 caractères",
            "sentToast":"Message envoyé ! Nous vous répondrons rapidement."
    }
,
    profilePage:     {
            "titleRecent":"Activité récente",
            "tokenBalance":"Solde de jetons",
            "available":"Disponible pour les débats",
            "totalDebates":"Débats au total",
            "sessions":"Sessions orchestrées",
            "noDebates":"Aucun débat trouvé. Lancez votre première session !",
            "anonymous":"Utilisateur anonyme",
            "banned":"BANNI"
    }

,
  "debateSettingsPage": {
    "title": "Paramètres du compte",
    "subtitle": "Gérez votre profil et vos préférences.",
    "profileInfo": "Informations du profil",
    "emailAddress": "Adresse e-mail",
    "displayName": "Nom d’affichage",
    "security": "Sécurité",
    "changePassword": "Changer le mot de passe",
    "dangerZone": "Zone de danger",
    "dangerText": "Une fois votre compte supprimé, il n’y a pas de retour en arrière.",
    "deleteAccount": "Supprimer le compte",
    "emailPlaceholder": "user@example.com",
    "displayNamePlaceholder": "Utilisateur Jarnazi"
  },
  "pricingPage": {
    "investIn": "Investissez dans",
    "intelligence": "l’intelligence",
    "currentPlan": "Forfait actuel",
    "availableBalance": "Solde disponible",
    "tokensLabel": "Tokens",
    "planSuffix": "Forfait",
    "freeTier": "Gratuit",
    "mostPopular": "Le plus populaire",
    "perPack": "/ pack",
    "descriptionLine1": "Achetez des tokens pour alimenter vos débats IA et la génération de contenu.",
    "tokensNeverExpire": "Les tokens n’expirent jamais",
    "descriptionLine2": "et peuvent être rechargés instantanément.",
    "enterpriseTitle": "Solution Enterprise",
    "enterpriseSubtitle": "Achetez une quantité personnalisée de tokens pour votre organisation.",
    "tokenAmount": "Quantité de tokens",
    "totalPrice": "Prix total",
    "enterpriseCustomLabel": "Enterprise Custom ({tokens} Tokens)",
    "plans": {
      "starter": {
        "name": "Pack Starter",
        "description": "Idéal pour des débats occasionnels.",
        "features": [
          "42 tokens de consensus",
          "Accès à GPT-4o & Claude 3",
          "Génération d’images basique",
          "Les tokens n’expirent jamais",
          "Résumés par e-mail"
        ]
      },
      "producer": {
        "name": "Forfait Producer",
        "description": "Pour les utilisateurs intensifs et la collaboration fréquente.",
        "features": [
          "155 tokens de consensus",
          "Accès à tous les nœuds",
          "Images haute résolution",
          "Traitement prioritaire",
          "Les tokens n’expirent jamais"
        ]
      },
      "creator": {
        "name": "Pro Creator",
        "description": "Boîte à outils ultime pour la création pro.",
        "features": [
          "1050 tokens de consensus",
          "Accès prioritaire (Tier 1)",
          "Génération vidéo 4K",
          "Support dédié",
          "Droits d’usage commercial",
          "Les tokens n’expirent jamais"
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

export default fr;
