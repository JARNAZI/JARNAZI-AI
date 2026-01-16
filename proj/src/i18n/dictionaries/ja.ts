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
        title3: "自動期限設計",
        desc3: "セッションと生成物は3日後に自動で期限切れ・削除。あなたが管理できます。"
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
    }
} as const;

export default ja;
