import React from "react";

export default async function SettingsPage(props: { params: Promise<{ lang: string }> }) {
    const params = await props.params;
    return (
        <div className="flex-1 p-8 bg-black">
            <header className="mb-12">
                <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
                <p className="text-gray-400">Manage your profile and preferences.</p>
            </header>

            <div className="max-w-2xl space-y-8">
                <section className="p-8 rounded-2xl bg-white/5 border border-white/10">
                    <h2 className="text-xl font-bold text-white mb-6">Profile Information</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                            <input type="email" readOnly className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-gray-300" placeholder="user@example.com" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Display Name</label>
                            <input type="text" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white" placeholder="Jarnazi User" />
                        </div>
                    </div>
                </section>

                <section className="p-8 rounded-2xl bg-white/5 border border-white/10">
                    <h2 className="text-xl font-bold text-white mb-6">Security</h2>
                    <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg transition-all text-sm font-medium">
                        Change Password
                    </button>
                </section>

                <section className="p-8 rounded-2xl bg-red-500/5 border border-red-500/20">
                    <h2 className="text-xl font-bold text-red-400 mb-2">Danger Zone</h2>
                    <p className="text-gray-400 text-sm mb-6">Once you delete your account, there is no going back.</p>
                    <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-all text-sm font-medium">
                        Delete Account
                    </button>
                </section>
            </div>
        </div>
    );
}
