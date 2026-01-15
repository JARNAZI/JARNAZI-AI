export default async function DebateLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ lang: string }>;
}) {
    return (
        <div className="h-full w-full bg-[#050505] text-white">
            {children}
        </div>
    );
}
