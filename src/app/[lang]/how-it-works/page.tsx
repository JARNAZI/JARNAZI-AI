
import Link from "next/link";
import { ArrowLeft, Brain, MessageSquare, FileText } from "lucide-react";
import { getDictionary } from "@/i18n/get-dictionary";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function HowItWorksPage(props: { params: Promise<{ lang: string }> }) {
    const { lang } = await props.params;
    const dict = await getDictionary(lang);

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col animate-fade-in">
            {/* Simple Header */}
            <nav className="border-b border-border glass sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href={`/${lang}`} className="flex items-center gap-2 text-foreground hover:text-primary transition-colors group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">{dict.common.back}</span>
                    </Link>
                    <div className="font-bold text-xl tracking-tight hidden sm:block">{dict.home.howItWorks}</div>
                    <div className="w-20 flex justify-end"> <ThemeToggle /> </div>
                </div>
            </nav>

            <main className="flex-1 container mx-auto px-6 py-12 max-w-4xl">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">{dict.howItWorks.title}</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        {dict.home.heroSubtitle}
                    </p>
                </div>

                {/* Content steps */}
                <div className="space-y-20 relative before:absolute before:inset-0 before:ml-8 md:before:ml-0 md:before:left-1/2 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent before:z-0">
                    {/* Step 1 */}
                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:justify-between group">
                        <div className="order-2 md:order-1 md:w-5/12 text-left md:text-right">
                            <h2 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">1. {dict.howItWorks.step1Title}</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                {dict.howItWorks.step1Desc}
                            </p>
                        </div>
                        <div className="order-1 md:order-2 w-16 h-16 rounded-2xl bg-background border-2 border-primary/20 flex items-center justify-center shrink-0 shadow-[0_0_20px_-5px_rgba(0,0,0,0.1)] z-10 group-hover:border-primary transition-colors duration-300">
                            <MessageSquare className="w-7 h-7 text-primary" />
                        </div>
                        <div className="order-3 md:order-3 md:w-5/12 hidden md:block"></div>
                    </div>

                    {/* Step 2 */}
                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:justify-between group">
                        <div className="order-3 md:order-1 md:w-5/12 hidden md:block"></div>
                        <div className="order-1 md:order-2 w-16 h-16 rounded-2xl bg-background border-2 border-accent/20 flex items-center justify-center shrink-0 shadow-[0_0_20px_-5px_rgba(0,0,0,0.1)] z-10 group-hover:border-accent transition-colors duration-300">
                            <Brain className="w-7 h-7 text-accent" />
                        </div>
                        <div className="order-2 md:order-3 md:w-5/12 text-left">
                            <h2 className="text-2xl font-bold mb-3 group-hover:text-accent transition-colors">2. {dict.howItWorks.step2Title}</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                {dict.howItWorks.step2Desc}
                            </p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:justify-between group">
                        <div className="order-2 md:order-1 md:w-5/12 text-left md:text-right">
                            <h2 className="text-2xl font-bold mb-3 group-hover:text-green-500 transition-colors">3. {dict.howItWorks.step3Title}</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                {dict.howItWorks.step3Desc}
                            </p>
                        </div>
                        <div className="order-1 md:order-2 w-16 h-16 rounded-2xl bg-background border-2 border-green-500/20 flex items-center justify-center shrink-0 shadow-[0_0_20px_-5px_rgba(0,0,0,0.1)] z-10 group-hover:border-green-500 transition-colors duration-300">
                            <FileText className="w-7 h-7 text-green-500" />
                        </div>
                        <div className="order-3 md:order-3 md:w-5/12 hidden md:block"></div>
                    </div>

                    {/* Step 4 */}
                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:justify-between group">
                        <div className="order-3 md:order-1 md:w-5/12 hidden md:block"></div>
                        <div className="order-1 md:order-2 w-16 h-16 rounded-2xl bg-background border-2 border-border flex items-center justify-center shrink-0 shadow-[0_0_20px_-5px_rgba(0,0,0,0.1)] z-10 group-hover:border-primary transition-colors duration-300">
                            <FileText className="w-7 h-7 text-muted-foreground" />
                        </div>
                        <div className="order-2 md:order-3 md:w-5/12 text-left">
                            <h2 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">4. {dict.howItWorks.step4Title}</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                {dict.howItWorks.step4Desc}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-24 text-center">
                    <div className="inline-block relative">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
                        <Link href={`/${lang}/debate`} className="relative z-10 inline-flex h-14 items-center justify-center rounded-full bg-primary px-10 font-bold text-white transition-all hover:bg-primary/90 hover:scale-105 active:scale-95 shadow-lg">
                            {dict.home.startDebate}
                        </Link>
                    </div>
                </div>

            </main>
        </div>
    )
}

