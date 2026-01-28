import React from "react";
import Link from "next/link";
import { DeleteAccountForm } from "./DeleteAccountForm";
import { deleteOwnAccount } from "./actions";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function SettingsPage(props: { params: Promise<{ lang: string }> }) {
  const params = await props.params;
  const dict = await getDictionary(params.lang);
  const t = dict.debateSettingsPage;

  return (
    <div className="flex-1 p-8 bg-background">
      <header className="mb-12">
        <h1 className="text-3xl font-bold text-foreground mb-2">{t.title}</h1>
        <p className="text-muted-foreground">{t.subtitle}</p>
      </header>

      <div className="max-w-2xl space-y-8">
        <section className="p-8 rounded-2xl bg-card/50 border border-border">
          <h2 className="text-xl font-bold text-foreground mb-6">{t.profileInfo}</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">{t.emailAddress}</label>
              <input
                type="email"
                readOnly
                className="w-full bg-background/60 border border-border rounded-lg px-4 py-2 text-foreground/80"
                placeholder={t.emailPlaceholder}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">{t.displayName}</label>
              <input
                type="text"
                className="w-full bg-background/60 border border-border rounded-lg px-4 py-2 text-foreground"
                placeholder={t.displayNamePlaceholder}
              />
            </div>
          </div>
        </section>

        <section className="p-8 rounded-2xl bg-card/50 border border-border">
          <h2 className="text-xl font-bold text-foreground mb-6">{t.security}</h2>
          <Link href={`/${params.lang}/update-password`} className="inline-flex h-10 items-center justify-center rounded-md border border-white/10 bg-white/5 px-4 text-sm font-medium text-white hover:bg-white/10">{t.changePassword}</Link>
        </section>

        <section className="p-8 rounded-2xl bg-destructive/5 border border-destructive/30">
          <h2 className="text-xl font-bold text-destructive mb-2">{t.dangerZone}</h2>
          <p className="text-muted-foreground text-sm mb-6">{t.dangerText}</p>
          <DeleteAccountForm action={deleteOwnAccount} label={t.deleteAccount} confirmText={t.dangerText} />
        </section>
      </div>
    </div>
  );
}

