import type { ReactNode } from 'react';

export default async function DebateLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <div className="h-full w-full bg-[#050505] text-white">
            {children}
        </div>
    );
}
