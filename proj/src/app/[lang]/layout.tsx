import type { Metadata } from "next";
import "../globals.css";
import { Toaster } from "@/components/ui/toaster";
import { LANGUAGES } from "@/i18n/config";

import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Jarnazi AI Consensus",
  description: "Advanced Multi-Agent AI Consensus Platform",
};

export async function generateStaticParams() {
  return LANGUAGES.map((lang) => ({ lang: lang.code }));
}

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
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
