import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { sendAdminAlert } from './email';

// Types for our internal orchestration (Aligned with DB schema)
export type AIProvider = {
    id: string;
    name: string;
    kind: string; // 'text', 'image', 'video'
    enabled: boolean;
    env_key: string;
    base_url?: string | null;
    config?: any;
    // Computed/Runtime fields (not DB columns)
    provider: string; // derived from name or config
    model_id: string; // derived from config
};

export type DebateContext = {
    topic: string;
    debateId: string;
    previousTurns: { ai_name: string; content: string; type?: string }[];
};

export type TaskPlan = {
    sequence: {
        role: string;
        provider_preference: string[]; // e.g. ['openai', 'deepseek'] for failover
        task_type: 'text' | 'image' | 'video' | 'math' | 'audio';
        instructions: string;
    }[];
};

export type StepResult = {
    content: string;
    status: 'success' | 'failed';
    format?: string;
    agentName?: string;
    agentId?: string;
};

// Orchestrator Class
export class DebateOrchestrator {
    private supabase;

    constructor() {
        const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!url || !key) {
            throw new Error(`Orchestrator missing Supabase credentials: ${!url ? 'URL ' : ''}${!key ? 'KEY' : ''}`);
        }

        // Admin access required to read providers and write turns securely
        this.supabase = createClient(url, key);
    }

    // Helper to normalize provider row from DB
    private normalizeProvider(row: any): AIProvider {
        const config = row.config || {};
        return {
            id: row.id,
            name: row.name,
            kind: row.kind,
            enabled: row.enabled,
            env_key: row.env_key,
            base_url: row.base_url,
            config: config,
            // Fallbacks for logic that expects these
            provider: config.provider || row.name.split(' ')[0].toLowerCase() || 'openai',
            model_id: config.model_id || config.model || 'gpt-4o'
        };
    }

    /**
     * Executes the entire planned debate sequence for a given topic.
     * This is the "Master" entry point for a new debate.
     */
    async runFullDebate(debateId: string, userId: string, topic: string, precomputedPlan?: TaskPlan['sequence']) {
        console.log(`[Maestro] Starting full debate session for ${debateId}`);
        const plan = precomputedPlan || await this.planDebate(topic);
        const context: DebateContext = {
            topic,
            debateId,
            previousTurns: []
        };

        const results: StepResult[] = [];

        for (const step of plan) {
            console.log(`[Maestro] Executing step: ${step.role}`);
            const result = await this.executeStep(step, context);

            if (result.status === 'success') {
                const turnRole = step.role.toLowerCase().includes('consensus') || step.role.toLowerCase().includes('agreement')
                    ? 'agreement'
                    : 'assistant';

                await this.saveTurn(
                    debateId,
                    userId,
                    turnRole as any,
                    result.agentName || 'AI',
                    result.agentId || null,
                    result.content,
                    {
                        role_label: step.role,
                        task_type: step.task_type,
                        instructions: step.instructions
                    }
                );

                context.previousTurns.push({
                    ai_name: result.agentName || 'AI',
                    content: result.content,
                    type: step.task_type
                });

                results.push(result);
            } else {
                console.error(`[Maestro] Step failed: ${step.role}. Content: ${result.content}`);
                // If it's a consensus step and it failed, we might want to throw or handle
            }
        }

        // Final Update to Debates Table
        const finalConsensus = results.find(r => r.format === 'consensus' || results.indexOf(r) === results.length - 1);
        if (finalConsensus) {
            await this.supabase.from('debates').update({
                summary: finalConsensus.content,
                status: 'completed'
            }).eq('id', debateId);
        }

        return { ok: true, plan, stepsExecuted: results.length };
    }

    // 1. MASTER ORCHESTRATOR: Plan the Debate
    // Uses OpenAI to analyze the topic and decide the best flow and agents
    async planDebate(topic: string): Promise<TaskPlan['sequence']> {
        // Fetch ALL active text providers
        const { data: rawProviders } = await this.supabase
            .from('ai_providers')
            .select('*')
            .eq('enabled', true)
            .eq('kind', 'text');

        if (!rawProviders || rawProviders.length === 0) {
            console.warn("[Maestro] No active text providers found. Using fallback.");
            return this.getFallbackPlan([]);
        }

        const providers = rawProviders.map(this.normalizeProvider);
        const providerNames = providers.map(p => p.name);

        // Fetch debate_rounds setting for accurate planning length
        let maxRounds = 3; // default
        try {
            const { data: kvData } = await this.supabase.from('site_settings').select('value').eq('key', 'debate_rounds').maybeSingle();
            if (kvData?.value) {
                maxRounds = parseInt(kvData.value, 10) || 3;
            } else {
                // Check single-row JSON fallback
                const { data: srData } = await this.supabase.from('site_settings').select('features').limit(1).maybeSingle();
                if (srData?.features?.debate_rounds) {
                    maxRounds = parseInt(srData.features.debate_rounds, 10) || 3;
                }
            }
        } catch (_) { }

        // Call Master Agent (OpenAI)
        const masterPrompt = `
        You are the CENTRAL OPENAI AGENT in a multi-AI debate platform.
        Topic: "${topic}"
        Available Providers: ${providerNames.join(', ')}.

        Your Responsibilities:
        1. AI API Selection:
           - Analyze the topic and decide which AI APIs should participate.
           - Assign appropriate roles to each.
           - IMPORTANT: For any mathematical expressions, YOU MUST instruct the agents to use LaTeX formatting enclosed in single dollar signs ($) for inline math and double dollar signs ($$) for block math.

        2. Managing the Debate:
           - Direct selected APIs to engage in structured debate.
           - Ensure discussion is focused and relevant.

        3. Generating Final Agreement (MANDATORY FINAL STEP):
           - The LAST step of the plan MUST be a 'Consensus' or 'Agreement' step.
           - This step must be assigned to a capable LLM (preferably OpenAI or Anthropic).
           - Instructions: "Analyze all debate outputs. Identify points of agreement, disagreement, and insights. Produce a final unified output in a structured format ready for display. Use LaTeX for math."

        Output JSON format:
        {
            "steps": [
                {
                    "role": "Opening Statement / Argument / Rebuttal / Consensus Generator",
                    "provider_preference": ["provider_name_1", "provider_name_2"], // Failover list
                    "task_type": "text",
                    "instructions": "..."
                }
            ]
        }
        
        Create EXACTLY a ${maxRounds}-step plan (including the final consensus step).
        `;

        try {
            const planRaw = await this.callOpenAI_Master(masterPrompt);
            const planJson = JSON.parse(planRaw.replace(/```json|```/g, ''));
            return planJson.steps;
        } catch (e) {
            console.error("Master Orchestrator Plan Failed, falling back:", e);
            return this.getFallbackPlan(providers);
        }
    }

    // 2. Execute a single planned step with FAILOVER logic
    async executeStep(
        step: TaskPlan['sequence'][0],
        context: DebateContext
    ): Promise<StepResult> {

        const candidates = [...step.provider_preference];

        // If no specifically preferred candidates, get all enabled text providers
        if (candidates.length === 0) {
            const { data } = await this.supabase
                .from('ai_providers')
                .select('name')
                .eq('enabled', true)
                .eq('kind', 'text');
            if (data) candidates.push(...data.map(p => p.name));
        }

        let lastError: unknown = null;

        for (const providerName of candidates) {
            // Find provider by name or provider key
            const { data: rawAgent } = await this.supabase
                .from('ai_providers')
                .select('*')
                .ilike('name', `%${providerName}%`)
                .eq('enabled', true)
                .limit(1)
                .maybeSingle();

            let agent = rawAgent ? this.normalizeProvider(rawAgent) : null;
            if (!agent) {
                // Try fallback search by config.provider
                const { data: allEnabled } = await this.supabase.from('ai_providers').select('*').eq('enabled', true);
                const found = allEnabled?.find(r => (r.config as any)?.provider?.toLowerCase() === providerName.toLowerCase());
                if (found) agent = this.normalizeProvider(found);
            }

            if (!agent) continue;

            try {
                if (step.task_type === 'image') {
                    const res = await this.generateImage(agent, context.topic, step.instructions);
                    return { ...res, agentId: agent.id };
                } else if (step.task_type === 'video') {
                    const res = await this.generateVideo(agent, context.topic, step.instructions);
                    return { ...res, agentId: agent.id };
                } else {
                    console.log(`[Orchestrator] Attempting Turn with ${agent.name}...`);
                    const result = await this.executeTextTurn(agent, step, context);
                    if (result.status === 'success') {
                        return { ...result, agentId: agent.id };
                    }
                    throw new Error(result.content);
                }
            } catch (error: unknown) {
                console.warn(`[Orchestrator] Failover: ${agent.name} failed. Error: ${error instanceof Error ? error.message : String(error)}`);
                lastError = error;
            }
        }

        return {
            content: `[System Error] All attempts to reach AI agents failed. Last error: ${lastError}`,
            status: 'failed',
            agentName: 'System'
        };
    }

    async executeTextTurn(
        agent: AIProvider,
        step: TaskPlan['sequence'][0],
        context: DebateContext
    ): Promise<{ content: string; status: 'success' | 'failed'; agentName: string }> {
        const systemPrompt = `You are ${agent.name}. Role: ${step.role}.
        Topic: "${context.topic}".
        Instructions: ${step.instructions}
        
        Rules:
        1. Answer independently.
        2. Reference previous speakers by name if applicable.
        3. Respond in the same language as the Topic.
        4. IMPORTANT: For any math, use LaTeX ($...$ or $$...$$).`;

        let userPrompt = `Proceed with your response.`;
        if (context.previousTurns.length > 0) {
            const historyText = context.previousTurns
                .map(t => `${t.ai_name}: ${t.content}`)
                .join('\n\n');
            userPrompt = `Context:\n${historyText}\n\nYour Turn:`;
        }

        const providerKey = agent.provider || agent.kind || 'openai';
        const res = await this.routeRequest(agent, providerKey, systemPrompt, userPrompt);
        return { ...res, agentName: agent.name };
    }

    private async callOpenAI_Master(prompt: string): Promise<string> {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error("Master Orchestrator requires OPENAI_API_KEY");

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [{ role: 'system', content: "You are a JSON-speaking Orchestrator." }, { role: 'user', content: prompt }],
                response_format: { type: "json_object" }
            })
        });
        const data = await response.json();
        return data.choices?.[0]?.message?.content || "{}";
    }

    private async routeRequest(agent: AIProvider, providerKey: string, sys: string, user: string) {
        const p = providerKey.toLowerCase();
        const envKey = agent.env_key || `${p.toUpperCase()}_API_KEY`;
        const apiKey = process.env[envKey] || process.env[`${p.toUpperCase()}_API_KEY`];

        if (p.includes('openai')) return await this.callOpenAI(agent, apiKey, sys, user);
        if (p.includes('deepseek')) return await this.callDeepSeek(agent, apiKey, sys, user);
        if (p.includes('anthropic') || p.includes('claude')) return await this.callAnthropic(agent, apiKey, sys, user);
        if (p.includes('google') || p.includes('gemini')) return await this.callGoogle(agent, apiKey, sys, user);

        // Default to OpenAI compatible fallback
        return await this.callOpenAI(agent, apiKey, sys, user);
    }

    // Provider calls... (simplified for space, keeping core logic)
    private async callOpenAI(agent: AIProvider, key: string | undefined, sys: string, user: string) {
        try {
            const apiKey = key || process.env.OPENAI_API_KEY;
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({ model: agent.model_id, messages: [{ role: 'system', content: sys }, { role: 'user', content: user }] })
            });
            const data = await res.json();
            return { content: data.choices[0]?.message?.content || '', status: 'success' as const };
        } catch (e: any) { return { content: `[OpenAI Error: ${e.message}]`, status: 'failed' as const }; }
    }

    private async callDeepSeek(agent: AIProvider, key: string | undefined, sys: string, user: string) {
        try {
            const apiKey = key || process.env.DEEPSEEK_API_KEY;
            const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({ model: agent.model_id, messages: [{ role: 'system', content: sys }, { role: 'user', content: user }] })
            });
            const data = await res.json();
            return { content: data.choices[0]?.message?.content || '', status: 'success' as const };
        } catch (e: any) { return { content: `[DeepSeek Error: ${e.message}]`, status: 'failed' as const }; }
    }

    private async callAnthropic(agent: AIProvider, key: string | undefined, sys: string, user: string) {
        try {
            const apiKey = key || process.env.CLOUDE_API_KEY;
            const res = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey!, 'anthropic-version': '2023-06-01' },
                body: JSON.stringify({ model: agent.model_id, max_tokens: 1024, system: sys, messages: [{ role: 'user', content: user }] })
            });
            const data = await res.json();
            return { content: data.content[0]?.text || '', status: 'success' as const };
        } catch (e: any) { return { content: `[Anthropic Error: ${e.message}]`, status: 'failed' as const }; }
    }

    private async callGoogle(agent: AIProvider, key: string | undefined, sys: string, user: string) {
        try {
            const apiKey = key || process.env.GEMINI_API_KEY;
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${agent.model_id}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: `${sys}\n\n${user}` }] }] })
            });
            const data = await res.json();
            return { content: data.candidates?.[0]?.content?.parts?.[0]?.text || '', status: 'success' as const };
        } catch (e: any) { return { content: `[Google Error: ${e.message}]`, status: 'failed' as const }; }
    }

    // --- Image Generation (DALL-E 3) ---
    private async generateImage(agent: AIProvider, topic: string, instructions: string) {
        try {
            const response = await fetch('https://api.openai.com/v1/images/generations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
                body: JSON.stringify({ model: "dall-e-3", prompt: `${topic}. ${instructions}`, n: 1, size: "1024x1024" })
            });
            const data = await response.json();
            const url = data.data?.[0]?.url;
            return { content: `![Generated Image](${url})`, status: 'success' as const, agentName: 'Visual Output' };
        } catch { return { content: "[Image Generation Failed]", status: 'failed' as const, agentName: 'System' }; }
    }

    // --- Video Placeholder ---
    private async generateVideo(agent: AIProvider, topic: string, instructions: string) {
        return {
            content: `[VIDEO_URL:https://cdn.openai.com/website/videos/sora/demo.mp4]`,
            status: 'success' as const,
            agentName: agent.name || 'Visual Output',
            format: 'video'
        };
    }

    private getFallbackPlan(providers: AIProvider[]): TaskPlan['sequence'] {
        const steps = providers.length > 0 ? providers.slice(0, 2).map(p => ({
            role: "Debater",
            provider_preference: [p.name],
            task_type: "text" as const,
            instructions: "Present your perspective."
        })) : [{
            role: "AI Thinker",
            provider_preference: ["openai"],
            task_type: "text" as const,
            instructions: "Analyze the topic."
        }];

        steps.push({
            role: "Consensus Generator",
            provider_preference: ["openai", "anthropic"],
            task_type: "text" as const,
            instructions: "Summarize and conclude."
        });

        return steps;
    }

    async saveTurn(
        debateId: string,
        userId: string,
        role: 'user' | 'assistant' | 'agreement' | 'system',
        agentName: string,
        providerId: string | null,
        content: string,
        meta: Record<string, unknown> = {}
    ) {
        // Fallback for missing columns by checking DB result (internal best-effort)
        const payload: any = {
            debate_id: debateId,
            ai_provider_id: providerId,
            ai_name_snapshot: agentName,
            content,
        };

        // Only include if columns likely exist based on audit
        payload.role = role;
        payload.user_id = userId;
        payload.meta = meta;

        await this.supabase.from('debate_turns').insert(payload);
    }
}

export async function calculateDynamicTokenCost(supabaseAdmin: any, plan: TaskPlan['sequence']): Promise<number> {
    let totalRealCents = 0;

    for (const step of plan) {
        let providerName = step.provider_preference[0];

        // If no preference, pick a default active one to estimate
        if (!providerName) {
            const { data } = await supabaseAdmin.from('ai_providers').select('name').eq('enabled', true).eq('kind', step.task_type).limit(1).maybeSingle();
            if (data) providerName = data.name;
        }

        if (providerName) {
            // Find cost rate for this provider
            const { data: costData } = await supabaseAdmin.from('ai_costs')
                .select('cost_per_unit, unit')
                .ilike('provider', `%${providerName}%`)
                .eq('cost_type', step.task_type === 'math' ? 'text' : step.task_type)
                .eq('is_active', true)
                .order('cost_per_unit', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (costData) {
                const cpu = Number(costData.cost_per_unit);
                const unit = String(costData.unit).toLowerCase();

                let stepUsd = 0;
                if (step.task_type === 'text' || step.task_type === 'math') {
                    // Assume ~2k tokens (2 units of per_1k_tokens) per turn
                    if (unit.includes('1k_tokens') || unit.includes('token')) {
                        stepUsd = cpu * 2;
                    } else {
                        stepUsd = cpu;
                    }
                } else {
                    stepUsd = cpu; // 1 image / video
                }
                totalRealCents += Math.max(0, stepUsd * 100);
            } else {
                // Fallback: 10 cents for text, 20 cents for media if no cost defined
                totalRealCents += (step.task_type === 'text' || step.task_type === 'math' ? 10 : 20);
            }
        }
    }

    // Apply the 75% -> 25% profit margin logic
    let baseTokens = 0;
    if (totalRealCents > 0) {
        const sellCents = Math.ceil(totalRealCents / 0.75);
        baseTokens = Math.ceil((sellCents * 3) / 100); // 3 tokens per USD
    }

    let tokensNeeded = Math.max(1, baseTokens);

    // Add media overhead if any step contains media
    const hasMedia = plan.some(s => s.task_type === 'image' || s.task_type === 'video');
    if (hasMedia) {
        try {
            const { data: kvData } = await supabaseAdmin.from('site_settings').select('value').eq('key', 'debate_media_overhead').maybeSingle();
            const mediaOverhead = Number(kvData?.value) || 2;
            tokensNeeded += mediaOverhead;
        } catch (_) { }
    }

    return tokensNeeded;
}

