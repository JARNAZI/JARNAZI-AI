import { SITE_NAME } from '../config';
const es = {
  common: {
    siteName: SITE_NAME,
    login: "Iniciar sesiÃ³n",
    register: "Registrarse",
    logout: "Cerrar sesiÃ³n",
    dashboard: "Panel",
    settings: "ConfiguraciÃ³n",
    profile: "Perfil",
    loading: "Cargando...",
    error: "OcurriÃ³ un error",
    save: "Guardar",
    cancel: "Cancelar",
    delete: "Eliminar",
    back: "Volver"
  },
  home: {
    heroTitle: "Debate. Acuerdo. CreaciÃ³n.",
    heroSubtitle: "Pregunta una vez. Varias IAs responden de forma independiente, se revisan entre sÃ­ y luego OpenAI lidera un consenso final â€” listo para imagen, video, audio o cÃ³digo.",
    startDebate: "Iniciar Debate",
    howItWorks: "CÃ³mo Funciona"
  },
  debate: {
    currentPlan: 'Current plan',
    newTitle: "Nuevo Debate",
    topicLabel: "Ingrese un tema...",
    startBtn: "Iniciar Debate",
    analyzing: "Analizando Tema...",
    consensusTitle: "Consenso Final",
    // Console UI
    consoleTitle: "Consola Jarnazi",
    online: "EN LÃNEA",
    text: "Texto",
    latex: "LaTex",
    file: "Archivo",
    image: "Imagen",
    video: "Video",
    audio: "Audio",
    print: "Imprimir",
    copy: "Copiar",
    save: "Guardar",
    download: "Descargar",
    placeholder: "Ingrese su argumento...",
    mathPlaceholder: "\\sum_{i=0}^n x_i",
    menu: "MenÃº del Sistema",
    copyJson: "Copiar Datos JSON",
    printTranscript: "Imprimir TranscripciÃ³n",
    viewPlans: "Ver Planes",
    editProfile: "Editar Perfil",
    contactUs: "ContÃ¡ctenos",
    sessionHistory: "Historial de Sesiones",
    language: "Idioma",
    darkMode: "Modo Oscuro",
    lightMode: "Modo Claro",
    deleteAccount: "Eliminar Cuenta"
  },
  notifications: {
    welcome: "Bienvenido al Consenso Jarnazi. El Consejo estÃ¡ listo."
  },
  nav: {
    features: "CaracterÃ­sticas",
    pricing: "Precios",
    contact: "ContÃ¡ctenos"
  },
  sidebar: {
    newSession: "Nueva SesiÃ³n",
    plans: "Planes",
    settings: "ConfiguraciÃ³n",
    signOut: "Cerrar SesiÃ³n",
    jarnazi: "JARNAZI",
    consensus: "CONSENSO"
  },
  features: {
    title1: "Debate multiagente",
    desc1: "Â¿Por quÃ© confiar en un solo modelo? ObtÃ©n perspectivas independientes de varias IAs con revisiÃ³n cruzada para reducir alucinaciones.",
    title2: "Consenso â†’ CreaciÃ³n",
    desc2: "Convierte el acuerdo final en un Ãºnico plan y prompt de alta calidad para generar imagen, video, audio o cÃ³digo.",
    title3: "VÃ­deo largo, a tu manera",
    desc3: "Genera vÃ­deos largosâ€”pelÃ­culas, series o programas de TVâ€”divididos en escenas y compuestos en un solo MP4 descargable."
  },
  footer: {
    privacy: "PolÃ­tica de Privacidad",
    terms: "TÃ©rminos de Uso",
    rights: "Todos los derechos reservados."
  },
  auth: {
    welcome: "Bienvenido de nuevo",
    subtitle: "Inicie sesiÃ³n para orquestar el debate.",
    email: "Correo ElectrÃ³nico",
    password: "ContraseÃ±a",
    signIn: "Iniciar SesiÃ³n",
    noAccount: "Â¿No tienes una cuenta?",
    createProfile: "Crear Perfil",
    securityCheck: "Por favor complete el control de seguridad."
  },
  howItWorks: {
    title: "Cómo Funciona",
    step1Title: "Debate multiagente",
    step1Desc: "Involucra múltiples modelos de IA en una deliberación estructurada para obtener los resultados más precisos y creativos.",
    step2Title: "Construcción de consenso",
    step2Desc: "La capa de orquestación avanzada sintetiza las salidas de modelos independientes en un consenso unificado.",
    step3Title: "Generación de activos",
    step3Desc: "Genera imágenes, videos y audio profesionales basados en el consenso deliberado.",
    step4Title: "Video de formato largo (Películas y Series)",
    step4Desc: "Genera videos largos—películas, episodios de series o programas de TV. Podemos dividir tu idea en escenas, crear segmentos y luego componer un solo MP4 que puedes ver y descargar."
  },
  landing: {
    badge: "El futuro de la inteligencia de consenso",
    subtitle2: "Estudio de Consenso IA"
  },
  dashboard: {
    neuralHub: "Neural Hub",
    underConstruction: "Este módulo está actualmente en construcción. El Neural Hub servirá como la capa de orquestación central para flujos de trabajo avanzados multi-agente.",
    returnToConsole: "Volver a la Consola"
  },
  contactPage: {
    "title": "ContÃ¡ctanos",
    "subtitle": "Â¿Preguntas, comentarios o consultas?",
    "name": "Nombre",
    "subject": "Asunto",
    "email": "Correo",
    "message": "Mensaje",
    "send": "Enviar mensaje",
    "namePh": "MÃ¡x. 25 caracteres",
    "subjectPh": "MÃ¡x. 20 caracteres",
    "emailPh": "tu@ejemplo.com",
    "messagePh": "Â¿CÃ³mo podemos ayudarte? (MÃ¡x. 250 caracteres)",
    "max250": "MÃ¡ximo 250 caracteres",
    "sentToast": "Â¡Mensaje enviado! Te responderemos en breve."
  }
  ,
  profilePage: {
    "titleRecent": "Actividad reciente",
    "tokenBalance": "Saldo de tokens",
    "available": "Disponible para debates",
    "totalDebates": "Debates totales",
    "sessions": "Sesiones orquestadas",
    "noDebates": "No se encontraron debates. Â¡Empieza tu primera sesiÃ³n!",
    "anonymous": "Usuario anÃ³nimo",
    "banned": "BLOQUEADO"
  }

  ,
  "debateSettingsPage": {
    "title": "ConfiguraciÃ³n de la cuenta",
    "subtitle": "Administra tu perfil y preferencias.",
    "profileInfo": "InformaciÃ³n del perfil",
    "emailAddress": "Correo electrÃ³nico",
    "displayName": "Nombre para mostrar",
    "security": "Seguridad",
    "changePassword": "Cambiar contraseÃ±a",
    "dangerZone": "Zona de peligro",
    "dangerText": "Una vez que elimines tu cuenta, no hay vuelta atrÃ¡s.",
    "deleteAccount": "Eliminar cuenta",
    "emailPlaceholder": "user@example.com",
    "displayNamePlaceholder": "Usuario Jarnazi"
  },
  "pricingPage": {
    "investIn": "Invierte en",
    "intelligence": "Inteligencia",
    "currentPlan": "Plan actual",
    "availableBalance": "Saldo disponible",
    "tokensLabel": "Tokens",
    "planSuffix": "Plan",
    "freeTier": "Gratis",
    "mostPopular": "MÃ¡s popular",
    "perPack": "/ paquete",
    "descriptionLine1": "Compra tokens para impulsar debates de IA y generaciÃ³n de contenido.",
    "tokensNeverExpire": "Los tokens no caducan",
    "descriptionLine2": "y puedes recargarlos al instante.",
    "enterpriseTitle": "SoluciÃ³n empresarial",
    "enterpriseSubtitle": "Compra una cantidad personalizada de tokens para tu organizaciÃ³n.",
    "tokenAmount": "Cantidad de tokens",
    "totalPrice": "Precio total",
    "enterpriseCustomLabel": "Enterprise Custom ({tokens} Tokens)",
    "plans": {
      "starter": {
        "name": "Paquete Starter",
        "description": "Perfecto para debates casuales y consultas ocasionales.",
        "features": [
          "42 tokens de consenso",
          "Acceso a GPT-4o & Claude 3",
          "GeneraciÃ³n de imÃ¡genes bÃ¡sica",
          "Los tokens no caducan",
          "ResÃºmenes por email"
        ]
      },
      "producer": {
        "name": "Plan Producer",
        "description": "Para usuarios avanzados con colaboraciÃ³n frecuente.",
        "features": [
          "155 tokens de consenso",
          "Acceso a todos los nodos",
          "ImÃ¡genes en alta resoluciÃ³n",
          "Procesamiento prioritario",
          "Los tokens no caducan"
        ]
      },
      "creator": {
        "name": "Pro Creator",
        "description": "Kit definitivo para creaciÃ³n profesional.",
        "features": [
          "1050 tokens de consenso",
          "Acceso prioritario (Tier 1)",
          "GeneraciÃ³n de video 4K",
          "Soporte dedicado",
          "Derechos de uso comercial",
          "Los tokens no caducan"
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

export default es;



