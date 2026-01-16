import { SITE_NAME } from '../config';
const es = {
common: {
        siteName: SITE_NAME,
        login: "Iniciar sesión",
        register: "Registrarse",
        logout: "Cerrar sesión",
        dashboard: "Panel",
        settings: "Configuración",
        profile: "Perfil",
        loading: "Cargando...",
        error: "Ocurrió un error",
        save: "Guardar",
        cancel: "Cancelar",
        delete: "Eliminar",
        back: "Volver"
    },
    home: {
        heroTitle: "Debate. Acuerdo. Creación.",
        heroSubtitle: "Pregunta una vez. Varias IAs responden de forma independiente, se revisan entre sí y luego OpenAI lidera un consenso final — listo para imagen, video, audio o código.",
        startDebate: "Iniciar Debate",
        howItWorks: "Cómo Funciona"
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
        online: "EN LÍNEA",
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
        menu: "Menú del Sistema",
        copyJson: "Copiar Datos JSON",
        printTranscript: "Imprimir Transcripción",
        viewPlans: "Ver Planes",
        editProfile: "Editar Perfil",
        contactUs: "Contáctenos",
        sessionHistory: "Historial de Sesiones",
        language: "Idioma",
        darkMode: "Modo Oscuro",
        lightMode: "Modo Claro",
        deleteAccount: "Eliminar Cuenta"
    },
    notifications: {
        welcome: "Bienvenido al Consenso Jarnazi. El Consejo está listo."
    },
    nav: {
        features: "Características",
        pricing: "Precios",
        contact: "Contáctenos"
    },
    sidebar: {
        newSession: "Nueva Sesión",
        plans: "Planes",
        settings: "Configuración",
        signOut: "Cerrar Sesión",
        jarnazi: "JARNAZI",
        consensus: "CONSENSO"
    },
    features: {
        title1: "Debate multiagente",
        desc1: "¿Por qué confiar en un solo modelo? Obtén perspectivas independientes de varias IAs con revisión cruzada para reducir alucinaciones.",
        title2: "Consenso → Creación",
        desc2: "Convierte el acuerdo final en un único plan y prompt de alta calidad para generar imagen, video, audio o código.",
        title3: "Diseñado para expirar",
        desc3: "Las sesiones y los recursos generados expiran automáticamente tras 3 días. Tú tienes el control."
    },
    footer: {
        privacy: "Política de Privacidad",
        terms: "Términos de Uso",
        rights: "Todos los derechos reservados."
    },
    auth: {
        welcome: "Bienvenido de nuevo",
        subtitle: "Inicie sesión para orquestar el debate.",
        email: "Correo Electrónico",
        password: "Contraseña",
        signIn: "Iniciar Sesión",
        noAccount: "¿No tienes una cuenta?",
        createProfile: "Crear Perfil",
        securityCheck: "Por favor complete el control de seguridad."
    },
    landing: {
        badge: "El futuro de la inteligencia de consenso",
        subtitle2: "Estudio de Consenso IA"
    }
} as const;

export default es;
