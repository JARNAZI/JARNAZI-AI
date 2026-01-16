import { SITE_NAME } from '../config';
const ar = {
common: {
        siteName: SITE_NAME,
        login: "تسجيل الدخول",
        register: "اشتراك",
        logout: "تسجيل الخروج",
        dashboard: "لوحة القيادة",
        settings: "إعدادات",
        profile: "الملف الشخصي",
        loading: "جار التحميل...",
        error: "حدث خطأ",
        save: "حفظ",
        cancel: "إلغاء",
        delete: "حذف",
        back: "رجوع"
    },
    home: {
        heroTitle: "نقاش. اتفاق. إبداع.",
        heroSubtitle: "اسأل مرة واحدة. عدة نماذج تجيب بشكل مستقل، ثم تراجع بعضها، وفي النهاية يقود OpenAI اتفاقًا نهائيًا جاهزًا للصورة أو الفيديو أو الصوت أو الكود.",
        startDebate: "بدء مناظرة",
        howItWorks: "كيف يعمل"
    },
    debate: {
        currentPlan: 'الخطة الحالية',
        newTitle: "مناظرة جديدة",
        topicLabel: "أدخل موضوعاً...",
        startBtn: "بدء المناظرة",
        analyzing: "جار تحليل الموضوع...",
        consensusTitle: "الإجماع النهائي",
        // Console UI
        consoleTitle: "وحدة تحكم Jarnazi",
        online: "متصل",
        text: "نص",
        latex: "LaTex",
        file: "ملف",
        image: "صورة",
        video: "فيديو",
        audio: "صوت",
        print: "طباعة",
        copy: "نسخ",
        save: "حفظ",
        download: "تنزيل",
        placeholder: "أدخل حجتك...",
        mathPlaceholder: "\\sum_{i=0}^n x_i",
        menu: "قائمة النظام",
        copyJson: "نسخ JSON",
        printTranscript: "طباعة النص",
        viewPlans: "عرض الخطط",
        editProfile: "تعديل الملف الشخصي",
        contactUs: "اتصل بنا",
        sessionHistory: "سجل الجلسات",
        language: "اللغة",
        darkMode: "الوضع الداكن",
        lightMode: "الوضع الفاتح",
        deleteAccount: "حذف الحساب"
    },
    notifications: {
        welcome: "مرحباً بكم في إجماع جارنازي. المجلس جاهز."
    },
    nav: {
        features: "المميزات",
        pricing: "التسعير",
        contact: "اتصل بنا"
    },
    sidebar: {
        newSession: "جلسة جديدة",
        plans: "الخطط",
        settings: "الإعدادات",
        signOut: "تسجيل الخروج",
        jarnazi: "جارنازي",
        consensus: "إجماع"
    },
    features: {
        title1: "مناظرة متعددة النماذج",
        desc1: "لماذا تعتمد على نموذج واحد؟ احصل على وجهات نظر مستقلة من عدة AIs مع مراجعة متبادلة لتقليل الهلوسة.",
        title2: "من الاتفاق إلى الإبداع",
        desc2: "حوّل الاتفاق النهائي إلى خطة/برومبت واحد عالي الجودة لتوليد الصور أو الفيديو أو الصوت أو الكود.",
        title3: "خصوصية بمدة محدودة",
        desc3: "تُحفظ الجلسات والمخرجات لمدة 3 أيام فقط ثم تُحذف تلقائيًا. أنت المتحكم."
    },
    footer: {
        privacy: "سياسة الخصوصية",
        terms: "شروط الاستخدام",
        rights: "جميع الحقوق محفوظة."
    },
    auth: {
        welcome: "مرحباً بك مجدداً",
        subtitle: "سجل الدخول لإدارة النقاش.",
        email: "البريد الإلكتروني",
        password: "كلمة المرور",
        signIn: "تسجيل الدخول",
        noAccount: "ليس لديك حساب؟",
        createProfile: "إنشاء ملف شخصي",
        securityCheck: "يرجى إكمال التحقق الأمني."
    },
    landing: {
        badge: "مناظرة ذكاء اصطناعي للمبدعين",
        subtitle2: "استوديو إجماع الذكاء الاصطناعي"
    }
} as const;

export default ar;
