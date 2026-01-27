import { SITE_NAME } from '../config';
const ja = {
common: {
        siteName: SITE_NAME,
        login: "ログイン",
        register: "登録",
        logout: "ログアウト",
        dashboard: "ダッシュボード",
        settings: "設定",
        profile: "プロフィール",
        loading: "読み込み中...",
        error: "エラーが発生しました",
        save: "保存",
        cancel: "キャンセル",
        delete: "削除",
        back: "戻る"
    },
    home: {
        heroTitle: "議論。合意。創造。",
        heroSubtitle: "一度質問。複数のAIが独立して回答し相互レビューし、最後にOpenAIが最終合意へ導きます — 画像・動画・音声・コードに対応。",
        startDebate: "ディベートを開始",
        howItWorks: "仕組み"
    },
    debate: {
        currentPlan: 'Current plan',
        newTitle: "新しいディベート",
        topicLabel: "トピックを入力...",
        startBtn: "ディベートを開始",
        analyzing: "トピックを分析中...",
        consensusTitle: "最終合意",
        // Console UI
        consoleTitle: "Jarnazi コンソール",
        online: "オンライン",
        text: "テキスト",
        latex: "LaTex",
        file: "ファイル",
        image: "画像",
        video: "動画",
        audio: "音声",
        print: "印刷",
        copy: "コピー",
        save: "保存",
        download: "ダウンロード",
        placeholder: "議論を入力してください...",
        mathPlaceholder: "\\sum_{i=0}^n x_i",
        menu: "システムメニュー",
        copyJson: "JSONをコピー",
        printTranscript: "トランスクリプトを印刷",
        viewPlans: "プランを表示",
        editProfile: "プロフィール編集",
        contactUs: "お問い合わせ",
        sessionHistory: "セッション履歴",
        language: "言語",
        darkMode: "ダークモード",
        lightMode: "ライトモード",
        deleteAccount: "アカウント削除"
    },
    notifications: {
        welcome: "Jarnaziコンセンサスへようこそ。評議会の準備が整いました。"
    },
    nav: {
        features: "機能",
        pricing: "価格",
        contact: "お問い合わせ"
    },
    sidebar: {
        newSession: "新しいセッション",
        plans: "プラン",
        settings: "設定",
        signOut: "ログアウト",
        jarnazi: "JARNAZI",
        consensus: "CONSENSUS"
    },
    features: {
        title1: "マルチエージェント討論",
        desc1: "1つのモデルだけに頼らない。複数AIの独立視点を相互レビューして、幻覚を減らします。",
        title2: "合意 → 生成",
        desc2: "最終合意を、画像・動画・音声・コード生成のための高品質なプラン／プロンプトにまとめます。",
        title3: "長尺動画に対応",
        desc3: "映画・シリーズ・TV番組のような長尺動画を、シーンに分割して生成し、1つのダウンロード可能なMP4にまとめます。"
    },
    footer: {
        privacy: "プライバシーポリシー",
        terms: "利用規約",
        rights: "All rights reserved."
    },
    auth: {
        welcome: "おかえりなさい",
        subtitle: "ログインして討論を開始しましょう。",
        email: "メールアドレス",
        password: "パスワード",
        signIn: "ログイン",
        noAccount: "アカウントをお持ちでないですか？",
        createProfile: "プロフィール作成",
        securityCheck: "セキュリティチェックを完了してください。"
    },
    landing: {
        badge: "コンセンサスインテリジェンスの未来",
        subtitle2: "AIコンセンサス・スタジオ"
    },
    contactPage:     {
            "title":"お問い合わせ",
            "subtitle":"ご質問・ご意見・お問い合わせはこちら",
            "name":"お名前",
            "subject":"件名",
            "email":"メール",
            "message":"メッセージ",
            "send":"送信",
            "namePh":"最大25文字",
            "subjectPh":"最大20文字",
            "emailPh":"you@example.com",
            "messagePh":"どのようにお手伝いできますか？（最大250文字）",
            "max250":"最大250文字",
            "sentToast":"送信しました。折り返しご連絡します。"
    }
,
    profilePage:     {
            "titleRecent":"最近のアクティビティ",
            "tokenBalance":"トークン残高",
            "available":"ディベートに利用可能",
            "totalDebates":"ディベート合計",
            "sessions":"実行したセッション",
            "noDebates":"ディベートが見つかりません。最初のセッションを開始しましょう！",
            "anonymous":"匿名ユーザー",
            "banned":"禁止"
    }

,
  "debateSettingsPage": {
    "title": "アカウント設定",
    "subtitle": "プロフィールと設定を管理します。",
    "profileInfo": "プロフィール情報",
    "emailAddress": "メールアドレス",
    "displayName": "表示名",
    "security": "セキュリティ",
    "changePassword": "パスワードを変更",
    "dangerZone": "危険ゾーン",
    "dangerText": "アカウントを削除すると元に戻せません。",
    "deleteAccount": "アカウント削除",
    "emailPlaceholder": "user@example.com",
    "displayNamePlaceholder": "Jarnaziユーザー"
  },
  "pricingPage": {
    "investIn": "投資する",
    "intelligence": "知能",
    "currentPlan": "現在のプラン",
    "availableBalance": "利用可能残高",
    "tokensLabel": "トークン",
    "planSuffix": "プラン",
    "freeTier": "無料",
    "mostPopular": "人気",
    "perPack": "/ パック",
    "descriptionLine1": "AIディベートとコンテンツ生成のためにトークンを購入します。",
    "tokensNeverExpire": "トークンは失効しません",
    "descriptionLine2": "いつでもすぐに追加できます。",
    "enterpriseTitle": "エンタープライズ",
    "enterpriseSubtitle": "組織向けにカスタム数量のトークンを購入します。",
    "tokenAmount": "トークン数量",
    "totalPrice": "合計金額",
    "enterpriseCustomLabel": "Enterprise Custom（{tokens} トークン）",
    "plans": {
      "starter": {
        "name": "スターター",
        "description": "気軽なディベートや時々の質問に最適。",
        "features": [
          "42 コンセンサストークン",
          "GPT-4o & Claude 3 へのアクセス",
          "基本の画像生成",
          "トークンは失効しません",
          "メール要約"
        ]
      },
      "producer": {
        "name": "プロデューサー",
        "description": "頻繁にAIを使うパワーユーザー向け。",
        "features": [
          "155 コンセンサストークン",
          "全ノードへのアクセス",
          "高解像度画像生成",
          "優先処理",
          "トークンは失効しません"
        ]
      },
      "creator": {
        "name": "プロクリエイター",
        "description": "プロ向けコンテンツ生成の決定版。",
        "features": [
          "1050 コンセンサストークン",
          "最優先アクセス（Tier 1）",
          "4K動画生成",
          "専用サポート",
          "商用利用権",
          "トークンは失効しません"
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

export default ja;
