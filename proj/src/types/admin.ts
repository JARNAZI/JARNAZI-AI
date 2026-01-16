export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

export type Id = string;

export interface ProviderRow {
  id: Id;
  name: string;
  provider: string;
  category: string;
  model_id: string;
  env_key: string | null;
  base_url: string | null;
  config: Json;
  is_active: boolean;
  priority: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProviderForm {
  id?: Id;
  name: string;
  provider: string;
  category: string;
  model_id: string;
  env_key: string | null;
  base_url: string | null;
  config: string; // JSON string in UI
  is_active: boolean;
  priority: number;
}

export interface ModelRow {
  id: Id;
  name: string;
  provider: string;
  category: string;
  capabilities: Json;
  cost_profile: Json;
  is_active: boolean;
  priority: number;
  created_at?: string;
  updated_at?: string;
}

export interface ModelForm {
  id?: Id;
  name: string;
  provider: string;
  category: string;
  capabilities: string; // JSON string in UI
  cost_profile: string; // JSON string in UI
  is_active: boolean;
  priority: number;
}

export interface SettingRow {
  key: string;
  value: string;
  description?: string | null;
  updated_at?: string;
}

export type SettingsMap = Record<string, SettingRow>;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
