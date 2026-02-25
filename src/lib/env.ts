/**
 * Runtime-safe environment variable access
 * This utility ensures that we don't accidentally use baked-in build-time values
 * when we actually want the live runtime environment.
 */

export function getEnvVar(key: string, required: boolean = false): string | undefined {
    // In Node.js (server), process.env is the live environment.
    // In the browser, process.env is a polyfill that only contains NEXT_PUBLIC_ vars.
    const value = process.env[key];

    if (!value && required) {
        if (typeof window === 'undefined') {
            console.error(`[CRITICAL] Missing required environment variable: ${key}`);
        }
    }

    return value || undefined;
}

export const isServer = typeof window === 'undefined';
export const isDev = process.env.NODE_ENV === 'development';
