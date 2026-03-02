import { createClient } from '@supabase/supabase-js';

export async function getRobustSetting<T = unknown>(supabase: any, key: string, fallback?: T): Promise<T> {
    // Strategy 1: key/value
    try {
        const { data: kv1 } = await supabase.from('site_settings').select('value').eq('key', key).maybeSingle();
        if (kv1?.value !== undefined && kv1?.value !== null) return kv1.value as T;
    } catch (_) { }

    // Strategy 2: setting_key/setting_value
    try {
        const { data: kv2 } = await supabase.from('site_settings').select('setting_value').eq('setting_key', key).maybeSingle();
        if (kv2?.setting_value !== undefined && kv2?.setting_value !== null) return kv2.setting_value as T;
    } catch (_) { }

    // Strategy 3: features JSONB in any row (fallback)
    try {
        const { data: row } = await supabase.from('site_settings').select('features').limit(1).maybeSingle();
        if (row?.features && (row.features as any)[key] !== undefined) return (row.features as any)[key] as T;
    } catch (_) { }

    return fallback as T;
}

export async function getAllRobustSettings(supabase: any, keys?: string[]): Promise<Record<string, unknown>> {
    const out: Record<string, unknown> = {};

    // Method 1: Fetch everything and merge
    try {
        const { data } = await supabase.from('site_settings').select('*');
        if (Array.isArray(data)) {
            data.forEach((row: any) => {
                const k = row.key || row.setting_key;
                const v = row.value !== undefined ? row.value : row.setting_value;
                if (k) {
                    if (!keys || keys.includes(k)) {
                        out[k] = v;
                    }
                }
                if (row.features) {
                    Object.entries(row.features as Record<string, any>).forEach(([fk, fv]) => {
                        if (!keys || keys.includes(fk)) {
                            if (out[fk] === undefined) out[fk] = fv;
                        }
                    });
                }
            });
        }
    } catch (_) { }

    return out;
}
