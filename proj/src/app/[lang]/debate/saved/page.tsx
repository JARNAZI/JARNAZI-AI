"use client";

import { ArrowLeft, Clock, FileImage, FileVideo, HardDrive } from "lucide-react";
import Link from "next/link";
import { use } from "react";

export default function SavedAssetsPage(props: { params: Promise<{ lang: string }> }) {
    const params = use(props.params);
    const lang = (params?.lang as string) || 'en';

    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            <header className="mb-12 max-w-5xl mx-auto flex items-center gap-4">
                <Link href={`/${lang}/debate`} className="p-2 hover:bg-foreground/5 rounded-full transition-colors text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Temporary Storage</h1>
                    <p className="text-muted-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Assets are automatically deleted after 24 hours
                    </p>
                </div>
            </header>

            <main className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Placeholder Cards */}
                <div className="p-6 rounded-2xl border border-border bg-card/50 flex flex-col items-center justify-center gap-4 text-center min-h-[200px]">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <HardDrive className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold">Saved Sessions</h3>
                        <p className="text-sm text-muted-foreground">0 saved sessions available</p>
                    </div>
                </div>

                <div className="p-6 rounded-2xl border border-border bg-card/50 flex flex-col items-center justify-center gap-4 text-center min-h-[200px]">
                    <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                        <FileVideo className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold">Generated Videos</h3>
                        <p className="text-sm text-muted-foreground">0 videos available</p>
                    </div>
                </div>

                <div className="p-6 rounded-2xl border border-border bg-card/50 flex flex-col items-center justify-center gap-4 text-center min-h-[200px]">
                    <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500">
                        <FileImage className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold">Generated Images</h3>
                        <p className="text-sm text-muted-foreground">0 images available</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
