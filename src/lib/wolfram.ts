/**
 * Wolfram Alpha Integration Utility
 * Uses the Wolfram Alpha Short Answers API to get factual responses
 */

export interface WolframConfig {
    appId: string;
}

export async function queryWolfram(
    query: string,
    config: WolframConfig
): Promise<{ result: string; status: 'success' | 'failed' }> {
    try {
        if (!config.appId) {
            throw new Error('Wolfram App ID is required');
        }

        // Wolfram Alpha Short Answers API
        const url = `https://api.wolframalpha.com/v1/result?appid=${encodeURIComponent(config.appId)}&i=${encodeURIComponent(query)}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'text/plain'
            }
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('Wolfram API Error:', text);
            return {
                result: `Unable to compute: ${text}`,
                status: 'failed'
            };
        }

        const result = await response.text();
        return {
            result: result || 'No result available',
            status: 'success'
        };

    } catch (error: unknown) {
        console.error('Wolfram Query Error:', error);
        return {
            result: `Error: ${(error instanceof Error ? error.message : String(error))}`,
            status: 'failed'
        };
    }
}
