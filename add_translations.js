import fs from 'fs';
import path from 'path';

const dictsDir = path.join('c:', 'Users', 'HP', 'Downloads', 'Ja_fixed_57_final_checklist_fixes-1', 'Ja_fixed_57_final_checklist_fixes-1', 'src', 'i18n', 'dictionaries');

const translations = {
  ar: {
    footerAbout: "من نحن",
    companyName: "JARNAZI OU",
    orchestraTitle: "أوركسترا الذكاء الاصطناعي (LLM Orchestra)",
    orchestraDesc: "موقعنا يقدم فكرة جديدة وهي عبارة عن أوركسترا LLM، حيث يتناقش الذكاء الاصطناعي ويقدم إجابات وحلول نهائية في نفس المكان ونفس الجلسة.",
    pricingTitle: "شراء التوكنات حسب الرغبة",
    pricingDesc: "الموقع لا يقدم خطط اشتراك معقدة. أنت من يحدد المبلغ الذي تريد الشراء به باستخدامه في الموقع. بمجرد إدخال المبلغ في خانة الشراء، يعطيك الموقع توكنات على حسب المبلغ الذي أدخلته، لتستخدمها بحرية تامة.",
    aboutTitle: "من نحن",
    aboutCompanyInfo: "معلومات الشركة",
    aboutCompanyNameLabel: "اسم الشركة",
    aboutCompanyNameValue: "JARNAZI OU",
    aboutAddressLabel: "عنوان الشركة",
    aboutAddressValue: "Ahtri 12, 10151, Tallinn Estonia",
    aboutFounderLabel: "المؤسس والمطور",
    aboutFounderValue: "AMJAD JARNAZI",
    aboutContactLabel: "للتواصل",
    aboutContactValue: "contact@jarnazi.com",
    aboutDescriptionTitle: "عن الموقع",
    aboutDescriptionValue: "الموقع يقدم فكرة جديدة وهي عبارة عن أوركسترا LLM، يتناقش AI، ويقدم إجابات وحلول نهائية في نفس المكان في نفس الجلسة، ويوفر الموقع ميزة جديدة وهي إمكانية توليد فيديو طويل، فيلم، مسلسل، برنامج تلفزيوني، الخ."
  },
  en: {
    footerAbout: "About Us",
    companyName: "JARNAZI OU",
    orchestraTitle: "LLM Orchestra",
    orchestraDesc: "The site offers a new concept: an LLM orchestra where AIs deliberate and provide final answers and solutions all in the same session.",
    pricingTitle: "Custom Token Purchases",
    pricingDesc: "We do not offer subscriptions. You decide exactly how much you want to spend. Simply enter the desired amount, and we will give you the corresponding tokens based on the amount entered.",
    aboutTitle: "About Us",
    aboutCompanyInfo: "Company Information",
    aboutCompanyNameLabel: "Company Name",
    aboutCompanyNameValue: "JARNAZI OU",
    aboutAddressLabel: "Address",
    aboutAddressValue: "Ahtri 12, 10151, Tallinn Estonia",
    aboutFounderLabel: "Founder & Developer",
    aboutFounderValue: "AMJAD JARNAZI",
    aboutContactLabel: "Contact",
    aboutContactValue: "contact@jarnazi.com",
    aboutDescriptionTitle: "About the Platform",
    aboutDescriptionValue: "The site offers a new concept, which is an LLM orchestra, where AI discusses and provides final answers and solutions in the same place in the same session. The site also provides a new feature: the ability to generate a long video, movie, series, TV show, etc."
  },
  fr: {
    footerAbout: "À Propos",
    companyName: "JARNAZI OU",
    orchestraTitle: "Orchestre LLM",
    orchestraDesc: "Le site propose un nouveau concept : un orchestre LLM, où l'IA discute et fournit des réponses finales dans la même session.",
    pricingTitle: "Achat de Jetons sur Mesure",
    pricingDesc: "Nous n'offrons pas d'abonnements. Vous décidez du montant exact à acheter en l'entrant, et vous recevez les jetons correspondants.",
    aboutTitle: "À Propos de Nous",
    aboutCompanyInfo: "Informations sur la Société",
    aboutCompanyNameLabel: "Nom de la Société",
    aboutCompanyNameValue: "JARNAZI OU",
    aboutAddressLabel: "Adresse",
    aboutAddressValue: "Ahtri 12, 10151, Tallinn Estonia",
    aboutFounderLabel: "Fondateur et Développeur",
    aboutFounderValue: "AMJAD JARNAZI",
    aboutContactLabel: "Contact",
    aboutContactValue: "contact@jarnazi.com",
    aboutDescriptionTitle: "À Propos de la Plateforme",
    aboutDescriptionValue: "Le site propose un nouveau concept, qui est un orchestre LLM, où l'IA discute et fournit des réponses finales. De plus, le site offre la possibilité de générer de longues vidéos, des séries, des émissions de télévision, etc."
  },
  es: {
    footerAbout: "Sobre Nosotros",
    companyName: "JARNAZI OU",
    orchestraTitle: "Orquesta LLM",
    orchestraDesc: "El sitio ofrece un nuevo concepto: una orquesta LLM donde las IA debaten y proporcionan respuestas finales en la misma sesión.",
    pricingTitle: "Compra de Tokens Personalizada",
    pricingDesc: "No ofrecemos suscripciones. Tú decides exactamente cuánto comprar introduciendo la cantidad, y recibes los tokens correspondientes.",
    aboutTitle: "Sobre Nosotros",
    aboutCompanyInfo: "Información de la Empresa",
    aboutCompanyNameLabel: "Nombre de la Empresa",
    aboutCompanyNameValue: "JARNAZI OU",
    aboutAddressLabel: "Dirección",
    aboutAddressValue: "Ahtri 12, 10151, Tallinn Estonia",
    aboutFounderLabel: "Fundador y Desarrollador",
    aboutFounderValue: "AMJAD JARNAZI",
    aboutContactLabel: "Contacto",
    aboutContactValue: "contact@jarnazi.com",
    aboutDescriptionTitle: "Sobre la Plataforma",
    aboutDescriptionValue: "El sitio ofrece un nuevo concepto, una orquesta LLM, donde la IA debate y da respuestas finales. Además, proporciona la capacidad de generar videos largos, películas, series, etc."
  },
  de: {
    footerAbout: "Über uns",
    companyName: "JARNAZI OU",
    orchestraTitle: "LLM-Orchester",
    orchestraDesc: "Die Website bietet ein neues Konzept: ein LLM-Orchester, in dem KIs diskutieren und in derselben Sitzung endgültige Antworten liefern.",
    pricingTitle: "Benutzerdefinierter Token-Kauf",
    pricingDesc: "Wir bieten keine Abonnements an. Sie entscheiden, wie viel Sie kaufen möchten, geben den Betrag ein und erhalten die entsprechenden Token.",
    aboutTitle: "Über uns",
    aboutCompanyInfo: "Unternehmensinformationen",
    aboutCompanyNameLabel: "Unternehmensname",
    aboutCompanyNameValue: "JARNAZI OU",
    aboutAddressLabel: "Adresse",
    aboutAddressValue: "Ahtri 12, 10151, Tallinn Estonia",
    aboutFounderLabel: "Gründer & Entwickler",
    aboutFounderValue: "AMJAD JARNAZI",
    aboutContactLabel: "Kontakt",
    aboutContactValue: "contact@jarnazi.com",
    aboutDescriptionTitle: "Über die Plattform",
    aboutDescriptionValue: "Die Website bietet ein neues LLM-Orchesterkonzept mit der Möglichkeit, lange Videos, Filme, Serien usw. zu erstellen."
  },
  it: {
    footerAbout: "Chi Siamo",
    companyName: "JARNAZI OU",
    orchestraTitle: "Orchestra LLM",
    orchestraDesc: "Il sito offre un nuovo concetto: un'orchestra LLM in cui l'IA discute e fornisce risposte finali nella stessa sessione.",
    pricingTitle: "Acquisto di Token Personalizzato",
    pricingDesc: "Non offriamo abbonamenti. Decidi tu quanto acquistare inserendo l'importo e ricevi i token corrispondenti.",
    aboutTitle: "Chi Siamo",
    aboutCompanyInfo: "Informazioni sull'Azienda",
    aboutCompanyNameLabel: "Nome dell'Azienda",
    aboutCompanyNameValue: "JARNAZI OU",
    aboutAddressLabel: "Indirizzo",
    aboutAddressValue: "Ahtri 12, 10151, Tallinn Estonia",
    aboutFounderLabel: "Fondatore e Sviluppatore",
    aboutFounderValue: "AMJAD JARNAZI",
    aboutContactLabel: "Contatto",
    aboutContactValue: "contact@jarnazi.com",
    aboutDescriptionTitle: "Informazioni sulla Piattaforma",
    aboutDescriptionValue: "Il sito offre un nuovo concetto di orchestra LLM con la capacità di generare video lunghi, film, serie, ecc."
  },
  pt: {
    footerAbout: "Sobre Nós",
    companyName: "JARNAZI OU",
    orchestraTitle: "Orquestra LLM",
    orchestraDesc: "O site oferece um novo conceito: uma orquestra LLM onde as IAs debatem e fornecem respostas finais na mesma sessão.",
    pricingTitle: "Compra de Tokens Personalizada",
    pricingDesc: "Não oferecemos assinaturas. Você decide o quanto deseja comprar, insere o valor e recebe os tokens correspondentes.",
    aboutTitle: "Sobre Nós",
    aboutCompanyInfo: "Informações da Empresa",
    aboutCompanyNameLabel: "Nome da Empresa",
    aboutCompanyNameValue: "JARNAZI OU",
    aboutAddressLabel: "Endereço",
    aboutAddressValue: "Ahtri 12, 10151, Tallinn Estonia",
    aboutFounderLabel: "Fundador e Desenvolvedor",
    aboutFounderValue: "AMJAD JARNAZI",
    aboutContactLabel: "Contato",
    aboutContactValue: "contact@jarnazi.com",
    aboutDescriptionTitle: "Sobre a Plataforma",
    aboutDescriptionValue: "O site oferece um novo conceito de orquestra LLM com a capacidade de gerar vídeos longos, filmes, séries, etc."
  },
  sv: {
    footerAbout: "Om Oss",
    companyName: "JARNAZI OU",
    orchestraTitle: "LLM Orkester",
    orchestraDesc: "Webbplatsen erbjuder ett nytt koncept: en LLM-orkester där AI debatterar och ger slutliga svar i samma session.",
    pricingTitle: "Anpassade Token Köp",
    pricingDesc: "Vi erbjuder inga prenumerationer. Du bestämmer exakt hur mycket du vill köpa genom att ange beloppet, och du får motsvarande tokens.",
    aboutTitle: "Om Oss",
    aboutCompanyInfo: "Företagsinformation",
    aboutCompanyNameLabel: "Företagsnamn",
    aboutCompanyNameValue: "JARNAZI OU",
    aboutAddressLabel: "Adress",
    aboutAddressValue: "Ahtri 12, 10151, Tallinn Estonia",
    aboutFounderLabel: "Grundare & Utvecklare",
    aboutFounderValue: "AMJAD JARNAZI",
    aboutContactLabel: "Kontakt",
    aboutContactValue: "contact@jarnazi.com",
    aboutDescriptionTitle: "Om Plattformen",
    aboutDescriptionValue: "Webbplatsen erbjuder ett nytt LLM-orkesterkoncept med möjligheten att generera långa videor, filmer, serier etc."
  },
  ja: {
    footerAbout: "私たちについて",
    companyName: "JARNAZI OU",
    orchestraTitle: "LLMオーケストラ",
    orchestraDesc: "当サイトは、同じセッションでAIが議論し、最終的な回答を提供するLLMオーケストラという新しいコンセプトを提供します。",
    pricingTitle: "カスタムトークンの購入",
    pricingDesc: "サブスクリプションは提供していません。購入したい金額を入力することで、それに応じたトークンを受け取ることができます。",
    aboutTitle: "私たちについて",
    aboutCompanyInfo: "会社情報",
    aboutCompanyNameLabel: "会社名",
    aboutCompanyNameValue: "JARNAZI OU",
    aboutAddressLabel: "住所",
    aboutAddressValue: "Ahtri 12, 10151, Tallinn Estonia",
    aboutFounderLabel: "創設者および開発者",
    aboutFounderValue: "AMJAD JARNAZI",
    aboutContactLabel: "お問い合わせ",
    aboutContactValue: "contact@jarnazi.com",
    aboutDescriptionTitle: "プラットフォームについて",
    aboutDescriptionValue: "当サイトはLLMオーケストラ機能を提供し、長いビデオや映画、シリーズなども生成することができます。"
  }
};

const languages = ['ar', 'en', 'fr', 'es', 'de', 'it', 'pt', 'sv', 'ja'];

for (const lang of languages) {
    const filePath = path.join(dictsDir, \`\${lang}.ts\`);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf-8');
        const trans = translations[lang] || translations['en'];

        // Add to footer:
        if (!content.includes('aboutUs:') && !content.includes('about:')) {
            content = content.replace(/footer:\s*\{/, \`footer: {
    about: "\${trans.footerAbout}",
    companyName: "\${trans.companyName}",\`);
        }

        // Add howItWorks additions:
        if (!content.includes('orchestraTitle:')) {
            content = content.replace(/howItWorks:\s*\{/, \`howItWorks: {
    orchestraTitle: "\${trans.orchestraTitle}",
    orchestraDesc: "\${trans.orchestraDesc}",
    pricingTitle: "\${trans.pricingTitle}",
    pricingDesc: "\${trans.pricingDesc}",\`);
        }

        // Add about page translations at the end before "} as const;"
        if (!content.includes('aboutUsPage:')) {
            const aboutUsBlock = \`
  ,
  aboutUsPage: {
    title: "\${trans.aboutTitle}",
    companyInfo: "\${trans.aboutCompanyInfo}",
    companyNameLabel: "\${trans.aboutCompanyNameLabel}",
    companyNameValue: "\${trans.aboutCompanyNameValue}",
    addressLabel: "\${trans.aboutAddressLabel}",
    addressValue: "\${trans.aboutAddressValue}",
    founderLabel: "\${trans.aboutFounderLabel}",
    founderValue: "\${trans.aboutFounderValue}",
    contactLabel: "\${trans.aboutContactLabel}",
    contactValue: "\${trans.aboutContactValue}",
    descriptionTitle: "\${trans.aboutDescriptionTitle}",
    descriptionValue: "\${trans.aboutDescriptionValue}"
  }
} as const;\`;
            content = content.replace(/\}\s*as\s+const\s*;?\s*$/, aboutUsBlock);
        }

        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(\`Updated \${lang}.ts\`);
    } else {
        console.log(\`\${lang}.ts not found!\`);
    }
}
