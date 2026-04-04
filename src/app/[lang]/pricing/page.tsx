import Link from "next/link";
import { ArrowLeft, Wallet, Infinity, HandCoins, CheckCircle2 } from "lucide-react";
import { getDictionary } from "@/i18n/get-dictionary";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function PricingInfoPage(props: { params: Promise<{ lang: string }> }) {
    const { lang } = await props.params;
    const dict = await getDictionary(lang);

    // Fallback dictionary for safety
    const pricingDict = dict.pricingInfoPage || {
        title: "Pricing & Billing",
        subtitle: "You have complete control over your budget with our Pay-As-You-Go model.",
        noSubscriptions: "No Complex Subscriptions",
        noSubscriptionsDesc: "We believe in total flexibility. You won't be tied to a monthly plan; you only pay what you intend to use.",
        customAmount: "Choose Your Amount",
        customAmountDesc: "Token value is flexible. Simply enter the dollar amount you want to spend, and the system will instantly calculate the corresponding tokens you'll receive for debates and media generation.",
        tokensNeverExpire: "Never Expiring Tokens",
        tokensNeverExpireDesc: "The tokens you purchase remain in your balance forever until you consume them, making it a smart investment for your future creative projects."
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col animate-fade-in">
            {/* Header */}
            <nav className="border-b border-border glass sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href={`/${lang}`} className="flex items-center gap-2 text-foreground hover:text-primary transition-colors group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">{dict.common.back}</span>
                    </Link>
                    <div className="font-bold text-xl tracking-tight hidden sm:block">{pricingDict.title}</div>
                    <div className="w-20 flex justify-end"><ThemeToggle /></div>
                </div>
            </nav>

            <main className="flex-1 container mx-auto px-6 py-12 max-w-5xl">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 text-primary mb-6 ring-1 ring-primary/20">
                        <Wallet className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">{pricingDict.title}</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        {pricingDict.subtitle}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 relative">
                    {/* Background glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[300px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

                    {/* Feature 1 */}
                    <div className="p-8 rounded-3xl glass-card relative group hover:-translate-y-2 transition-transform duration-300">
                        <div className="absolute inset-0 bg-red-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20 group-hover:bg-red-500/20 transition-colors">
                            <HandCoins className="w-7 h-7 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold mb-4">{pricingDict.noSubscriptions}</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            {pricingDict.noSubscriptionsDesc}
                        </p>
                    </div>

                    {/* Feature 2: Highlighted */}
                    <div className="p-8 rounded-3xl glass-card relative group border-primary shadow-lg shadow-primary/10 hover:-translate-y-2 transition-transform duration-300 z-10">
                        <div className="absolute inset-0 bg-primary/5 rounded-3xl opacity-100 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute -top-4 inset-x-0 text-center">
                            <span className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest py-1 px-3 rounded-full">
                                Pay-As-You-Go
                            </span>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mt-2 mb-6 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                            <CheckCircle2 className="w-7 h-7 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold mb-4">{pricingDict.customAmount}</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            {pricingDict.customAmountDesc}
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="p-8 rounded-3xl glass-card relative group hover:-translate-y-2 transition-transform duration-300">
                        <div className="absolute inset-0 bg-green-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6 border border-green-500/20 group-hover:bg-green-500/20 transition-colors">
                            <Infinity className="w-7 h-7 text-green-500" />
                        </div>
                        <h3 className="text-xl font-bold mb-4">{pricingDict.tokensNeverExpire}</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            {pricingDict.tokensNeverExpireDesc}
                        </p>
                    </div>
                </div>

                <div className="text-center pb-20">
                    <p className="text-muted-foreground mb-8 text-lg">
                        {lang === 'ar' ? "قم بتسجيل الدخول لبدء المداولة وشراء التوكنات بكل حرية." : "Sign in to start deliberating and buy tokens freely."}
                    </p>
                    <Link href={`/${lang}/login`} className="inline-flex h-14 items-center justify-center rounded-full bg-foreground text-background px-10 font-bold transition-all hover:bg-foreground/90 hover:scale-105 active:scale-95 shadow-lg gap-2">
                        {dict.common?.login || "Login"} <ArrowLeft className={lang === 'ar' ? 'w-5 h-5' : 'w-5 h-5 rotate-180'} />
                    </Link>
                </div>
            </main>
        </div>
    );
}
