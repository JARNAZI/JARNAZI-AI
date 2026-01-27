import { getDictionary } from '@/i18n/get-dictionary';

export default async function NeuralHubPage(props: { params: Promise<{ lang: string }> }) {
  const params = await props.params;
  const lang = params.lang;
  const dict = await getDictionary(lang as any);
  const d = dict.dashboard || {};

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-card border border-border p-12 rounded-3xl shadow-2xl max-w-lg flex flex-col items-center">
        <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
          <Construction className="w-10 h-10 text-indigo-500" />
        </div>

        <h1 className="text-3xl font-black uppercase tracking-tight mb-4">{d.neuralHub || "Neural Hub"}</h1>
        <p className="text-muted-foreground font-medium mb-8">
          {d.underConstruction || "This module is currently under construction. The Neural Hub will serve as the central orchestration layer for advanced multi-agent workflows."}
        </p>

        <Link
          href={`/${lang}/debate`}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20"
        >
          <ArrowLeft className="w-4 h-4" />
          {d.returnToConsole || "Return to Console"}
        </Link>
      </div>

      <div className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-50">
        {dict.common?.siteName || "Jarnazi AI Consensus"} • System v1.0
      </div>
    </div>
  );
}
