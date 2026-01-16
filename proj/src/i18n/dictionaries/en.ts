import { SITE_NAME } from '../config';
const en = {
common: {
        siteName: SITE_NAME,
        login: "Log in",
        register: "Sign up",
        logout: "Log out",
        dashboard: "Dashboard",
        settings: "Settings",
        profile: "Profile",
        loading: "Loading...",
        error: "An error occurred",
        save: "Save",
        cancel: "Cancel",
        delete: "Delete",
        back: "Back"
    },
    home: {
        heroTitle: "Debate. Agree. Create.",
        heroSubtitle: "Ask once. Multiple AIs answer independently, review each other, then OpenAI leads a final consensus — ready for images, video, audio, or code.",
        startDebate: "Start Debate",
        howItWorks: "How It Works"
    },
    debate: {
        currentPlan: 'Current plan',
        newTitle: "New Debate",
        topicLabel: "Enter a topic...",
        startBtn: "Initiate Debate",
        analyzing: "Analyzing Topic...",
        consensusTitle: "Final Consensus",
        // Console UI
        consoleTitle: "Jarnazi Console",
        online: "ONLINE",
        text: "Text",
        latex: "LaTex",
        file: "File",
        image: "Image",
        video: "Video",
        audio: "Audio",
        print: "Print",
        copy: "Copy",
        save: "Save",
        download: "Download",
        placeholder: "Enter your debate argument...",
        mathPlaceholder: "\\sum_{i=0}^n x_i",
        menu: "System Menu",
        copyJson: "Copy JSON Data",
        printTranscript: "Print Transcript",
        viewPlans: "View Plans",
        editProfile: "Edit Profile",
        contactUs: "Contact Us",
        sessionHistory: "Session History",
        language: "Language",
        darkMode: "Dark Mode",
        lightMode: "Light Mode",
        deleteAccount: "Delete Account"
    },
    notifications: {
        welcome: "Welcome to Jarnazi Consensus. The Council is ready."
    },
    nav: {
        features: "Features",
        pricing: "Pricing",
        contact: "Contact Us"
    },
    sidebar: {
        newSession: "New Session",
        plans: "Plans",
        settings: "Settings",
        signOut: "Sign Out",
        jarnazi: "JARNAZI",
        consensus: "CONSENSUS"
    },
    features: {
        title1: "Multi-Agent Debate",
        desc1: "Why rely on one model? Get independent perspectives from multiple AIs, cross-reviewed to reduce hallucinations.",
        title2: "Consensus → Creation",
        desc2: "Turn the final agreement into a single high-quality plan and prompt for image, video, audio, or code generation.",
        title3: "Short-Lived by Design",
        desc3: "Sessions and generated assets auto-expire after 3 days. You stay in control."
    },
    footer: {
        privacy: "Privacy Policy",
        terms: "Terms of Use",
        rights: "All rights reserved."
    },
    auth: {
        welcome: "Welcome Back",
        subtitle: "Sign in to orchestrate the debate.",
        email: "Email Address",
        password: "Password",
        signIn: "Sign In",
        noAccount: "Don't have an account?",
        createProfile: "Create Profile",
        securityCheck: "Please complete the security check."
    },
    landing: {
        badge: "Multi-AI Debate for Creators",
        subtitle2: "AI Consensus Studio"
    }
} as const;

export default en;
