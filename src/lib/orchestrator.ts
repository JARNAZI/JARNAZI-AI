import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { sendAdminAlert } from './email';

// Types for our internal orchestration
export type AIProvider = {
    id: string;
    name: string;
    provider: string; // 'openai', 'anthropic', 'google', 'deepseek', 'replicate'
    model_id: string;
    base_url?: string;
    capabilities: string[]; // ['text', 'image', 'video', 'math']
    priority: number;
    config?: unknown;
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

// Orchestrator Class
export class DebateOrchestrator {
    private supabase;

    constructor() {
        // Admin access required to read providers and write turns securely
        this.supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
    }

    // 1. MASTER ORCHESTRATOR: Plan the Debate
    // Uses OpenAI to analyze the topic and decide the best flow and agents
    async planDebate(topic: string): Promise<TaskPlan['sequence']> {
        // Fetch all active providers to know our arsenal
        const { data: providers } = await this.supabase
            .from('ai_providers')
            .select('*')
            .eq('is_active', true)
            .order('priority', { ascending: true });

        if (!providers || providers.length === 0) return [];

        // Identify TIER 1 (Supabase/Env keys) vs TIER 2
        // For this logic, we assume 'priority' column handles this, or specific provider names
        const tier1 = providers.filter(p => p.priority <= 1).map(p => p.provider);
        const tier2 = providers.filter(p => p.priority > 1).map(p => p.provider);

        // Call Master Agent (OpenAI)
        // Call Master Agent (OpenAI)
        const masterPrompt = `
        You are the CENTRAL OPENAI AGENT in a multi-AI debate platform.
        Topic: "${topic}"
        Available Providers: ${tier1.join(', ')}, ${tier2.join(', ')}.

        Your Responsibilities:
        1. AI API Selection:
           - Analyze the topic and decide which AI APIs should participate.
           - If text: select appropriate LLMs.
           - If images requested: assign 'image' task to capable API (OpenAI DALL-E).
           - If video requested: assign 'video' task (OpenAI/Replicate).
           - Ensure chosen APIs are best fit.
           - IMPORTANT: For any mathematical expressions, YOU MUST instruct the agents to use LaTeX formatting enclosed in single dollar signs ($) for inline math and double dollar signs ($$) for block math.

        2. Managing the Debate:
           - Direct selected APIs to engage in structured debate.
           - Ensure discussion is focused and relevant.

        3. Generating Final Agreement (MANDATORY FINAL STEP):
           - The LAST step of the plan MUST be a 'Consensus' or 'Agreement' step.
           - This step must be assigned to a capable LLM (preferably OpenAI or Anthropic).
           - Instructions for this final step must be: "Analyze all debate outputs. Identify points of agreement, disagreement, and insights. Produce a final unified output in a structured format (Plan, Document, Code, Report, or Bullet Points) ready for display or download. IMPORTANT: For any mathematical expressions, YOU MUST use LaTeX formatting enclosed in single dollar signs ($) for inline math and double dollar signs ($$) for block math."

        4. Media Integration:
           - If images/video were requested, ensure they are scheduled early enough to be referenced or included.

        Output JSON format:
        {
            "steps": [
                {
                    "role": "Opening Statement / Argument / Rebuttal / Illustrator / Consensus Generator",
                    "provider_preference": ["openai", "deepseek"], // Priority list
                    "task_type": "text" (or "image", "video"),
                    "instructions": "Specific instructions for this agent to follow..."
                }
            ]
        }
        
        Create a 3-6 step plan ending with the Agreement/Consensus step.
        `;

        try {
            const planRaw = await this.callOpenAI_Master(masterPrompt);
            const planJson = JSON.parse(planRaw.replace(/```json|```/g, ''));
            return planJson.steps;
        } catch (e) {
            console.error("Master Orchestrator Failed, falling back to linear default:", e);
            return this.getFallbackPlan(providers);
        }
    }

    // 2. Execute a single planned step with FAILOVER logic
    async executeStep(
        step: TaskPlan['sequence'][0],
        context: DebateContext
    ): Promise<{ content: string; status: 'success' | 'failed'; format?: string; agentName?: string }> {

        const candidates = [...step.provider_preference];
        // If no preference or candidates empty, fallback to any active provider
        if (candidates.length === 0) {
            const { data } = await this.supabase
                .from('ai_providers')
                .select('provider')
                .eq('is_active', true)
                .limit(3); // Grab a few to try
            if (data) candidates.push(...data.map(p => p.provider));
        }

        let lastError: unknown = null;

        for (const providerName of candidates) {
            // 1. Get Provider Details
            const { data: agent } = await this.supabase
                .from('ai_providers')
                .select('*')
                .eq('provider', providerName)
                .eq('is_active', true)
                .single();

            if (!agent) continue;

            try {
                // 2. Execute based on Task Type
                if (step.task_type === 'image') {
                    return await this.generateImage(agent, context.topic, step.instructions);
                } else if (step.task_type === 'video') {
                    return await this.generateVideo(agent, context.topic, step.instructions);
                } else {
                    // Text / Math
                    console.log(`Attempting execution with ${agent.name}...`);
                    const result = await this.executeTextTurn(agent, step, context);
                    if (result.status === 'success') {
                        return result;
                    }
                    throw new Error(result.content); // Trigger failover if status is failed but no exception
                }
            } catch (error: unknown) {
                console.warn(`Step failed on agent ${agent.name} (${providerName}), trying next...`, (error instanceof Error ? error.message : String(error)));
                lastError = error;
                // Don't alert admin yet, only if all fail
            }
        }

        // If we reach here, all candidates failed
        const errorMsg = lastError instanceof Error ? lastError.message : "No available agents found";
        console.error("All providers failed for step:", step);

        await sendAdminAlert(
            `Critical Step Failure`,
            `All providers failed for step: ${step.role}\nLast Error: ${errorMsg}`
        );

        return { content: `[System Error: All available AI agents failed to respond. Please try again.]`, status: 'failed' };
    }


    async executeTextTurn(
        agent: AIProvider,
        step: TaskPlan['sequence'][0],
        context: DebateContext
    ): Promise<{ content: string; status: 'success' | 'failed'; agentName: string }> {
        // Construct Prompt
        const systemPrompt = `You are ${agent.name}. Role: ${step.role}.
        Topic: "${context.topic}".
        Instructions: ${step.instructions}
        
        Rules:
        1. Answer independently.
        2. Reference previous speakers by name if applicable.
        3. Explicitly state agreements/disagreements.
        4. Respond in the same language as the Topic.
        5. IMPORTANT: For any mathematical expressions, YOU MUST use LaTeX formatting enclosed in single dollar signs ($) for inline math and double dollar signs ($$) for block math.`;

        let userPrompt = `Proceed with your response.`;
        if (context.previousTurns.length > 0) {
            const historyText = context.previousTurns
                .map(t => `${t.ai_name}: ${t.content}`)
                .join('\n\n');
            userPrompt = `Context:\n${historyText}\n\nYour Turn:`;
        }

        const res = await this.routeRequest(agent, systemPrompt, userPrompt);
        return { ...res, agentName: agent.name };
    }

    // Master Agent Logic (using OpenAI specific key)
    private async callOpenAI_Master(prompt: string): Promise<string> {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error("Master Orchestrator requires OPENAI_API_KEY");

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: 'gpt-4o', // Or gpt-4-turbo
                messages: [{ role: 'system', content: "You are a JSON-speaking Orchestrator." }, { role: 'user', content: prompt }],
                response_format: { type: "json_object" }
            })
        });
        const data = await response.json();
        return data.choices?.[0]?.message?.content || "{}";
    }

    // Helpers
    private async routeRequest(agent: AIProvider, sys: string, user: string) {
        switch (agent.provider.toLowerCase()) {
            case 'openai': return await this.callOpenAI(agent, sys, user);
            case 'deepseek': return await this.callDeepSeek(agent, sys, user);
            case 'anthropic': return await this.callAnthropic(agent, sys, user);
            case 'google': return await this.callGoogle(agent, sys, user);
            case 'mistral': return await this.callMistral(agent, sys, user);
            case 'cohere': return await this.callCohere(agent, sys, user);
            case 'replicate': return await this.callReplicateText(agent, sys, user);
            default: return { content: `[Provider ${agent.provider} n/a]`, status: 'failed' as const };
        }
    }

    // --- Image Generation ---
    private async generateImage(agent: AIProvider, topic: string, instructions: string) {
        if (agent.provider !== 'openai') return { content: "[Image not supported by this provider]", status: 'failed' as const, agentName: 'System' };
        try {
            const refinementPrompt = `Optimize this image generation prompt for DALL-E 3 to be highly detailed and artistic: "${topic}. ${instructions}"`;
            const { content: optimizedPrompt } = await this.callOpenAI(agent, "You are a prompt engineer.", refinementPrompt);
            const response = await fetch('https://api.openai.com/v1/images/generations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
                body: JSON.stringify({ model: "dall-e-3", prompt: optimizedPrompt || `${topic}. ${instructions}`, n: 1, size: "1024x1024" })
            });
            const data = await response.json();
            const url = data.data?.[0]?.url;
            return { content: `![Generated Image](${url})<!-- EXPIRES: 24H -->\n\n*Prompt: ${optimizedPrompt?.slice(0, 50)}...*`, status: 'success' as const, agentName: 'Visual Output' };
        } catch { return { content: "[Image Generation Failed]", status: 'failed' as const, agentName: 'System' }; }
    }

    // --- Video Generation ---
    private async generateVideo(agent: AIProvider, topic: string, instructions: string) {
        // Placeholder output until a real video provider (Runway/Luma/etc.) is integrated.
        const safeTopic = (topic || '').slice(0, 140);
        const safeInstr = (instructions || '').slice(0, 140);
        return {
            content: `\n\n![Video Thumbnail](https://via.placeholder.com/800x450.png?text=Video+Generated)\n\n**Topic:** ${safeTopic}\n\n**Instructions:** ${safeInstr}\n\n[VIDEO_URL:https://cdn.openai.com/website/videos/sora/demo.mp4]\n<!-- EXPIRES: 24H -->\n`,
            status: 'success' as const,
            agentName: agent.name || 'Visual Output',
            format: 'video'
        };
    }

    // --- Standard Providers ---
    private async callOpenAI(agent: AIProvider, systemPrompt: string, userPrompt: string) {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
                body: JSON.stringify({ model: agent.model_id, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }] })
            });
            const data = await response.json();
            return { content: data.choices[0]?.message?.content || '', status: 'success' as const };
        } catch (error: unknown) {
            const message = error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error);
            return { content: `[OpenAI Error: ${message}]`, status: 'failed' as const };
        }
    }

    private async callDeepSeek(agent: AIProvider, systemPrompt: string, userPrompt: string) {
        try {
            const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` },
                body: JSON.stringify({ model: agent.model_id, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }] })
            });
            const data = await response.json();
            return { content: data.choices[0]?.message?.content || '', status: 'success' as const };
        } catch (error: unknown) { return { content: `[DeepSeek Error: ${(error instanceof Error ? error.message : String(error))}]`, status: 'failed' as const }; }
    }

    private async callAnthropic(agent: AIProvider, systemPrompt: string, userPrompt: string) {
        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
                body: JSON.stringify({ model: agent.model_id, max_tokens: 1024, system: systemPrompt, messages: [{ role: 'user', content: userPrompt }] })
            });
            const data = await response.json();
            return { content: data.content[0]?.text || '', status: 'success' as const };
        } catch (error: unknown) { return { content: `[Anthropic Error: ${(error instanceof Error ? error.message : String(error))}]`, status: 'failed' as const }; }
    }

    private async callGoogle(agent: AIProvider, systemPrompt: string, userPrompt: string) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${agent.model_id}:generateContent?key=${process.env.GOOGLE_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }] })
            });
            const data = await response.json();
            return { content: data.candidates?.[0]?.content?.parts?.[0]?.text || '', status: 'success' as const };
        } catch (error: unknown) { return { content: `[Google Error: ${(error instanceof Error ? error.message : String(error))}]`, status: 'failed' as const }; }
    }

    // Mistral Integration
    private async callMistral(agent: AIProvider, systemPrompt: string, userPrompt: string) {
        try {
            const apiKey = process.env.Mistral_api_key;
            if (!apiKey) throw new Error("Missing Mistral_api_key");

            const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: agent.model_id,
                    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }]
                })
            });
            const data = await response.json();
            return { content: data.choices?.[0]?.message?.content || '', status: 'success' as const };
        } catch (error: unknown) {
            return { content: `[Mistral Error: ${(error instanceof Error ? error.message : String(error))}]`, status: 'failed' as const };
        }
    }

    // Cohere Integration
    private async callCohere(agent: AIProvider, systemPrompt: string, userPrompt: string) {
        try {
            const apiKey = process.env.Cohere_api_key;
            if (!apiKey) throw new Error("Missing Cohere_api_key");

            const response = await fetch('https://api.cohere.ai/v1/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: agent.model_id,
                    message: userPrompt,
                    preamble: systemPrompt
                })
            });
            const data = await response.json();
            return { content: data.text || '', status: 'success' as const };
        } catch (error: unknown) {
            return { content: `[Cohere Error: ${(error instanceof Error ? error.message : String(error))}]`, status: 'failed' as const };
        }
    }

    // Replicate Integration (Text)
    private async callReplicateText(agent: AIProvider, systemPrompt: string, userPrompt: string) {
        try {
            const apiKey = process.env.Replicate_api_key;
            if (!apiKey) throw new Error("Missing Replicate_api_key");

            // Replicate prediction API typically involves a POST to creating a prediction
            // Valid model ID is required: owner/name:version
            const response = await fetch('https://api.replicate.com/v1/predictions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${apiKey}`
                },
                body: JSON.stringify({
                    version: agent.model_id.includes(':') ? agent.model_id.split(':')[1] : agent.model_id, // simplistic parsing
                    input: {
                        prompt: `${systemPrompt}\n\n${userPrompt}`,
                        max_tokens: 1024
                    }
                })
            });

            const prediction = await response.json();

            // Polling would be required here for Replicate, or we assume a synchronous endpoint if available.
            // For simplicity in this turn, we'll return a placeholder or handle the stream slightly if possible.
            // But usually Replicate is async. We will output a status message for now as we can't block easily without polling loop.

            // Simplistic Polling (User beware: this blocks)
            if (prediction.status) {
                let current = prediction;
                while (current.status !== 'succeeded' && current.status !== 'failed') {
                    await new Promise(r => setTimeout(r, 1000));
                    const poll = await fetch(current.urls.get, {
                        headers: { 'Authorization': `Token ${apiKey}` }
                    });
                    current = await poll.json();
                }
                if (current.status === 'succeeded') return { content: current.output.join(''), status: 'success' as const };
            }

            return { content: "", status: 'failed' as const };
        } catch (error: unknown) {
            return { content: `[Replicate Error: ${(error instanceof Error ? error.message : String(error))}]`, status: 'failed' as const };
        }
    }

    // Helpers
    private getFallbackPlan(providers: AIProvider[]): TaskPlan['sequence'] {
        // Fallback: Linear debate
        const steps = providers.map(p => ({
            role: "Debater",
            provider_preference: [p.provider],
            task_type: "text" as const,
            instructions: "Present your perspective."
        }));

        // Add Moderator
        steps.push({
            role: "Moderator",
            provider_preference: ["openai"],
            task_type: "text" as const,
            instructions: "Summarize and conclude."
        });

        return steps;
    }

    // 4. Commit result to DB
    async saveTurn(
        debateId: string,
        userId: string,
        role: 'user' | 'assistant' | 'agreement' | 'system',
        agentName: string,
        providerId: string | null,
        content: string,
        meta: Record<string, unknown> = {}
    ) {
        await this.supabase.from('debate_turns').insert({
            debate_id: debateId,
            user_id: userId,
            role,
            ai_provider_id: providerId,
            ai_name_snapshot: agentName,
            content,
            meta,
        });
    }

    // Helper for route.ts to get moderator specifically for conclusion if needed separately
    // But now master plan handles it. We keep this for backward compat if route needs it.
    async getModerator() {
        // ...
        return null;
    }
}

