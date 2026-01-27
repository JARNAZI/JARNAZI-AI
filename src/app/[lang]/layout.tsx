import type { Metadata } from "next";
import "../globals.css";
import { Toaster } from "@/components/ui/toaster";
import { LANGUAGES } from "@/i18n/config";

import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Jarnazi AI Consensus",
  description: "Advanced Multi-Agent AI Consensus Platform",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;


import { LanguageSync } from "@/components/LanguageSync";

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;

  return (
    <html lang={lang} suppressHydrationWarning>
      {/* Avoid build-time Google Fonts fetches on CI/CD (Netlify) by using system fonts */}
      <body className="font-sans antialiased">
        <LanguageSync lang={lang} />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <div className="fixed bottom-2 right-2 z-[9999] px-2 py-1 bg-primary/10 border border-primary/20 rounded-md text-[10px] text-primary/70 pointer-events-none select-none backdrop-blur-sm">
            UI Verified – Lang OK – Build v28-HARDENED
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
