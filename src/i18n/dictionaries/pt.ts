import { SITE_NAME } from '../config';
const pt = {
common: {
        siteName: SITE_NAME,
        login: "Entrar",
        register: "Inscrever-se",
        logout: "Sair",
        dashboard: "Painel",
        settings: "Configurações",
        profile: "Perfil",
        loading: "Carregando...",
        error: "Ocorreu um erro",
        save: "Salvar",
        cancel: "Cancelar",
        delete: "Excluir",
        back: "Voltar"
    },
    home: {
        heroTitle: "Debate. Acordo. Criação.",
        heroSubtitle: "Pergunte uma vez. Várias IAs respondem de forma independente, se revisam entre si e a OpenAI lidera um consenso final — pronto para imagem, vídeo, áudio ou código.",
        startDebate: "Iniciar Debate",
        howItWorks: "Como Funciona"
    },
    debate: {
        currentPlan: 'Current plan',
        newTitle: "Novo Debate",
        topicLabel: "Digite um tópico...",
        startBtn: "Iniciar Debate",
        analyzing: "Analisando Tópico...",
        consensusTitle: "Consenso Final",
        // Console UI
        consoleTitle: "Console Jarnazi",
        online: "ONLINE",
        text: "Texto",
        latex: "LaTex",
        file: "Arquivo",
        image: "Imagem",
        video: "Vídeo",
        audio: "Áudio",
        print: "Imprimir",
        copy: "Copiar",
        save: "Salvar",
        download: "Baixar",
        placeholder: "Digite seu argumento...",
        mathPlaceholder: "\\sum_{i=0}^n x_i",
        menu: "Menu do Sistema",
        copyJson: "Copiar JSON",
        printTranscript: "Imprimir Transcrição",
        viewPlans: "Ver Planos",
        editProfile: "Editar Perfil",
        contactUs: "Contate-nos",
        sessionHistory: "Histórico das Sessões",
        language: "Idioma",
        darkMode: "Modo Escuro",
        lightMode: "Modo Claro",
        deleteAccount: "Excluir Conta"
    },
    notifications: {
        welcome: "Bem-vindo ao Consenso Jarnazi. O Conselho está pronto."
    },
    nav: {
        features: "Recursos",
        pricing: "Preços",
        contact: "Fale Conosco"
    },
    sidebar: {
        newSession: "Nova Sessão",
        plans: "Planos",
        settings: "Configurações",
        signOut: "Sair",
        jarnazi: "JARNAZI",
        consensus: "CONSENSO"
    },
    features: {
        title1: "Debate multiagente",
        desc1: "Por que depender de um único modelo? Obtenha perspectivas independentes de várias IAs, com revisão cruzada para reduzir alucinações.",
        title2: "Consenso → Criação",
        desc2: "Transforme o acordo final em um único plano e prompt de alta qualidade para gerar imagem, vídeo, áudio ou código.",
        title3: "Vídeos longos",
        desc3: "Gere vídeos longos—filmes, séries ou programas de TV—divididos em cenas e compostos em um único MP4 para download."
    },
    footer: {
        privacy: "Política de Privacidade",
        terms: "Termos de Uso",
        rights: "Todos os direitos reservados."
    },
    auth: {
        welcome: "Bem-vindo de volta",
        subtitle: "Faça login para orquestrar o debate.",
        email: "Endereço de E-mail",
        password: "Senha",
        signIn: "Entrar",
        noAccount: "Não tem uma conta?",
        createProfile: "Criar Perfil",
        securityCheck: "Por favor, complete a verificação de segurança."
    },
    landing: {
        badge: "O Futuro da Inteligência de Consenso",
        subtitle2: "Estúdio de Consenso IA"
    },
    contactPage:     {
            "title":"Fale Conosco",
            "subtitle":"Dúvidas, feedback ou solicitações?",
            "name":"Nome",
            "subject":"Assunto",
            "email":"E-mail",
            "message":"Mensagem",
            "send":"Enviar mensagem",
            "namePh":"Máx. 25 caracteres",
            "subjectPh":"Máx. 20 caracteres",
            "emailPh":"voce@exemplo.com",
            "messagePh":"Como podemos ajudar? (Máx. 250 caracteres)",
            "max250":"Máximo de 250 caracteres",
            "sentToast":"Mensagem enviada com sucesso! Retornaremos em breve."
    }
,
    profilePage:     {
            "titleRecent":"Atividade recente",
            "tokenBalance":"Saldo de tokens",
            "available":"Disponível para debates",
            "totalDebates":"Total de debates",
            "sessions":"Sessões orquestradas",
            "noDebates":"Nenhum debate encontrado. Comece sua primeira sessão!",
            "anonymous":"Usuário anônimo",
            "banned":"BANIDO"
    }

,
  "debateSettingsPage": {
    "title": "Configurações da conta",
    "subtitle": "Gerencie seu perfil e preferências.",
    "profileInfo": "Informações do perfil",
    "emailAddress": "E-mail",
    "displayName": "Nome de exibição",
    "security": "Segurança",
    "changePassword": "Alterar senha",
    "dangerZone": "Zona de risco",
    "dangerText": "Depois de excluir sua conta, não há como voltar.",
    "deleteAccount": "Excluir conta",
    "emailPlaceholder": "user@example.com",
    "displayNamePlaceholder": "Usuário Jarnazi"
  },
  "pricingPage": {
    "investIn": "Invista em",
    "intelligence": "Inteligência",
    "currentPlan": "Plano atual",
    "availableBalance": "Saldo disponível",
    "tokensLabel": "Tokens",
    "planSuffix": "Plano",
    "freeTier": "Grátis",
    "mostPopular": "Mais popular",
    "perPack": "/ pacote",
    "descriptionLine1": "Compre tokens para alimentar seus debates de IA e geração de conteúdo.",
    "tokensNeverExpire": "Os tokens nunca expiram",
    "descriptionLine2": "e podem ser recarregados instantaneamente.",
    "enterpriseTitle": "Solução Enterprise",
    "enterpriseSubtitle": "Compre uma quantidade personalizada de tokens para sua organização.",
    "tokenAmount": "Quantidade de tokens",
    "totalPrice": "Preço total",
    "enterpriseCustomLabel": "Enterprise Custom ({tokens} Tokens)",
    "plans": {
      "starter": {
        "name": "Starter Pack",
        "description": "Perfeito para debates casuais e consultas ocasionais.",
        "features": [
          "42 Tokens de consenso",
          "Acesso ao GPT-4o & Claude 3",
          "Geração de imagem básica",
          "Os tokens nunca expiram",
          "Resumos por e-mail"
        ]
      },
      "producer": {
        "name": "Producer Plan",
        "description": "Para usuários avançados com colaboração frequente.",
        "features": [
          "155 Tokens de consenso",
          "Acesso a todos os nós",
          "Imagem em alta resolução",
          "Processamento prioritário",
          "Os tokens nunca expiram"
        ]
      },
      "creator": {
        "name": "Pro Creator",
        "description": "Toolkit definitivo para criação profissional.",
        "features": [
          "1050 Tokens de consenso",
          "Acesso prioritário (Tier 1)",
          "Geração de vídeo 4K",
          "Suporte dedicado",
          "Direitos de uso comercial",
          "Os tokens nunca expiram"
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

export default pt;
