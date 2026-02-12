import Link from "next/link";
import { Shield, FileText, Mail, Brain } from "lucide-react";
import { getDictionary } from "@/i18n/get-dictionary";
import { StartDebateButton } from "@/components/home/StartDebateButton";
import Navbar from "@/components/home/Navbar";

export default async function Home(props: { params: Promise<{ lang: string }> }) {
  const params = await props.params;
  const { lang } = params;
  const dict = await getDictionary(lang);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white flex flex-col relative overflow-x-hidden transition-colors duration-300">

      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[130px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[130px] animate-pulse" style={{ animationDuration: '7s' }} />
      </div>

      {/* Navbar */}
      <Navbar lang={lang} dict={dict} />

      {/* Hero Section */}
      <main className="flex-1 relative z-10 flex flex-col pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center mt-12 md:mt-24 mb-20 animate-fade-in-up">


          <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-8 leading-[1.1]">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-muted-foreground">
              {dict.home.heroTitle.split(' — ')[0]} —
            </span>
            <br />
            <span className="text-gradient text-5xl md:text-7xl">
              {dict.home.heroTitle.split(' — ')[1]}
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
            {dict.home.heroSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <StartDebateButton lang={lang} text={dict.home.startDebate} />
            <Link href={`/${lang}/how-it-works`} className="px-8 py-4 rounded-full glass hover:bg-foreground/5 transition-colors text-foreground font-medium border border-border">
              {dict.home.howItWorks}
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="max-w-7xl mx-auto w-full grid md:grid-cols-3 gap-6 relative z-10 mt-12">
          <div className="p-8 rounded-3xl glass-card hover:-translate-y-2 transition-transform duration-300 group">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20 group-hover:bg-primary/20 transition-colors">
              <Brain className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-foreground">{dict.features.title1}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {dict.features.desc1}
            </p>
          </div>

          <div className="p-8 rounded-3xl glass-card hover:-translate-y-2 transition-transform duration-300 group">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 border border-accent/20 group-hover:bg-accent/20 transition-colors">
              <FileText className="w-7 h-7 text-accent" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-foreground">{dict.features.title2}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {dict.features.desc2}
            </p>
          </div>

          <div className="p-8 rounded-3xl glass-card hover:-translate-y-2 transition-transform duration-300 group">
            <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6 border border-green-500/20 group-hover:bg-green-500/20 transition-colors">
              <Shield className="w-7 h-7 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-foreground">{dict.features.title3}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {dict.features.desc3}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background/50 backdrop-blur-xl py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-2">
            <div className="text-lg font-bold text-foreground tracking-tight">{dict.common.siteName}</div>
            <div className="text-sm text-muted-foreground">
              © 2024 {dict.common.siteName}. {dict.footer.rights}
            </div>
          </div>

          <div className="flex items-center gap-8">
            <Link href={`/${lang}/privacy`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{dict.footer.privacy}</Link>
            <Link href={`/${lang}/terms`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{dict.footer.terms}</Link>
            <Link href={`/${lang}/contact`} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>{dict.nav.contact}</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

