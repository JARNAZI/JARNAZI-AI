'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';

export default function ProviderForm() {
    const router = useRouter();
    const [supabase] = useState(() => createClient());
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        provider: 'openai',
        model_id: '',
        category: 'text',
        priority: 10,
        config: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Parse config if present
            let configJson = {};
            if (formData.config) {
                try {
                    configJson = JSON.parse(formData.config);
                } catch (e) {
                    throw new Error('Invalid JSON in Configuration field. Please verify format.');
                }
            }

            const { error } = await supabase
                .from('ai_providers')
                .insert([{
                    name: formData.name,
                    provider: formData.provider,
                    model_id: formData.model_id,
                    category: formData.category,
                    priority: formData.priority,
                    config: configJson
                }]);

            if (error) throw error;

            router.push('/admin/providers');
            router.refresh();
        } catch (error: any) {
            alert('Error creating provider: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Display Name</label>
                <input
                    type="text"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="e.g. GPT-4 or Claude 3"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Provider</label>
                    <select
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={formData.provider}
                        onChange={e => setFormData({ ...formData, provider: e.target.value })}
                    >
                        <optgroup label="Text / General">
                            <option value="openai">OpenAI (GPT/o1/o3)</option>
                            <option value="anthropic">Anthropic Claude</option>
                            <option value="google">Google Gemini</option>
                            <option value="mistral">Mistral AI</option>
                            <option value="cohere">Cohere</option>
                            <option value="deepseek">DeepSeek</option>
                            <option value="qwen">Qwen</option>
                        </optgroup>
                        <optgroup label="Image">
                            <option value="stability">Stability AI</option>
                            <option value="replicate">Replicate</option>
                        </optgroup>
                        <optgroup label="Video">
                            <option value="luma">Luma Dream Machine</option>
                            <option value="runway">RunwayML</option>
                            <option value="fal">Fal.ai</option>
                            <option value="vertex">Google Vertex AI Veo</option>
                        </optgroup>
                        <optgroup label="Audio">
                            <option value="elevenlabs">ElevenLabs</option>
                        </optgroup>
                        <optgroup label="Security">
                            <option value="safebrowsing">Google Safe Browsing</option>
                            <option value="cloudflare">Cloudflare Turnstile</option>
                        </optgroup>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Model ID / App ID</label>
                    <input
                        type="text"
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="e.g. gpt-4, o1, stability-xl..."
                        value={formData.model_id}
                        onChange={e => setFormData({ ...formData, model_id: e.target.value })}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Configuration JSON (Optional)</label>
                <textarea
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm h-24"
                    placeholder='{"appId": "..."}'
                    value={formData.config}
                    onChange={e => setFormData({ ...formData, config: e.target.value })}
                />
                <p className="text-xs text-gray-500">Enter JSON configuration if required by the provider.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Category</label>
                    <select
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                    >
                        <option value="text">Text</option>
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                        <option value="audio">Audio</option>
                        <option value="math">Math</option>
                        <option value="security">Security</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Priority</label>
                    <input
                        type="number"
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={formData.priority}
                        onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    />
                </div>
            </div>

            <div className="pt-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    {loading ? 'Initializing...' : (
                        <>
                            <Save className="w-4 h-4" />
                            Save Node Configuration
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
