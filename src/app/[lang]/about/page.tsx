import Link from "next/link";
import { ArrowLeft, Building2, User, Mail, Component } from "lucide-react";
import { getDictionary } from "@/i18n/get-dictionary";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function AboutUsPage(props: { params: Promise<{ lang: string }> }) {
    const { lang } = await props.params;
    const dict = await getDictionary(lang);

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col animate-fade-in">
            {/* Header */}
            <nav className="border-b border-border glass sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href={`/${lang}`} className="flex items-center gap-2 text-foreground hover:text-primary transition-colors group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">{dict.common.back}</span>
                    </Link>
                    <div className="font-bold text-xl tracking-tight hidden sm:block">{dict.aboutUsPage?.title || "About Us"}</div>
                    <div className="w-20 flex justify-end"><ThemeToggle /></div>
                </div>
            </nav>

            <main className="flex-1 container mx-auto px-6 py-12 max-w-4xl">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">{dict.aboutUsPage?.title || "About Us"}</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        {dict.aboutUsPage?.companyInfo || "Company Information"}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    {/* Company Info Card */}
                    <div className="p-8 rounded-3xl glass-card relative group">
                        <div className="absolute inset-0 bg-primary/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <Building2 className="w-10 h-10 text-primary mb-6" />
                        <h3 className="text-xl font-bold mb-4">{dict.aboutUsPage?.companyNameLabel || "Company Name"}</h3>
                        <p className="text-xl font-medium mb-6">{dict.aboutUsPage?.companyNameValue || "JARNAZI OU"}</p>

                        <h3 className="text-xl font-bold mb-4">{dict.aboutUsPage?.addressLabel || "Address"}</h3>
                        <p className="text-muted-foreground text-lg">
                            {dict.aboutUsPage?.addressValue || "Ahtri 12, 10151, Tallinn Estonia"}
                        </p>
                    </div>

                    {/* Founder & Contact Card */}
                    <div className="p-8 rounded-3xl glass-card relative group">
                        <div className="absolute inset-0 bg-accent/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <User className="w-10 h-10 text-accent mb-6" />
                        <h3 className="text-xl font-bold mb-4">{dict.aboutUsPage?.founderLabel || "Founder & Developer"}</h3>
                        <p className="text-xl font-medium mb-6">{dict.aboutUsPage?.founderValue || "AMJAD JARNAZI"}</p>

                        <Mail className="w-8 h-8 text-muted-foreground mb-4 mt-8" />
                        <h3 className="text-xl font-bold mb-4">{dict.aboutUsPage?.contactLabel || "Contact"}</h3>
                        <a href={`mailto:${dict.aboutUsPage?.contactValue || "contact@jarnazi.com"}`} className="text-lg text-primary hover:underline">
                            {dict.aboutUsPage?.contactValue || "contact@jarnazi.com"}
                        </a>
                    </div>
                </div>

                {/* Mission & Vision */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    <div className="p-8 rounded-3xl bg-primary/5 border border-primary/10">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">01</span>
                            {dict.aboutUsPage?.missionTitle || "Our Mission"}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {dict.aboutUsPage?.missionValue || "To empower creators and businesses with AI."}
                        </p>
                    </div>
                    <div className="p-8 rounded-3xl bg-accent/5 border border-accent/10">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent text-sm font-bold">02</span>
                            {dict.aboutUsPage?.visionTitle || "Our Vision"}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {dict.aboutUsPage?.visionValue || "To be the world's premier destination for AI-driven production."}
                        </p>
                    </div>
                </div>

                {/* About the platform */}
                <div className="p-10 rounded-3xl glass-card relative overflow-hidden">
                    <div className="absolute -right-20 -top-20 z-0">
                        <Component className="w-64 h-64 text-primary/5 rotate-12" />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold mb-6">{dict.aboutUsPage?.descriptionTitle || "About the Platform"}</h2>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            {dict.aboutUsPage?.descriptionValue || "The site offers a new concept..."}
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
