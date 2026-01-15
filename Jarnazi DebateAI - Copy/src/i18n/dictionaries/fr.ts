import { SITE_NAME } from '../config';
export default {
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
        title3: "Conçu pour expirer",
        desc3: "Les sessions et contenus générés expirent automatiquement après 3 jours. Vous gardez le contrôle."
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
    }
} as const;

