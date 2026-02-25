export default function AuthCodeErrorPage() {
    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
            <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
                <h1 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">Authentication Error</h1>
                <p className="text-zinc-400 mb-8 leading-relaxed">
                    We encountered an issue while verifying your login. This link may have expired or was already used.
                </p>
                <div className="flex flex-col gap-3">
                    <a
                        href="/login"
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 rounded-xl transition-all active:scale-95 uppercase tracking-widest text-xs"
                    >
                        Back to Login
                    </a>
                    <a
                        href="/"
                        className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-black py-3 rounded-xl transition-all active:scale-95 uppercase tracking-widest text-xs"
                    >
                        Return Home
                    </a>
                </div>
            </div>
        </div>
    );
}
