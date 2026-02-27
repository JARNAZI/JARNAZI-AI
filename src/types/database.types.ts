export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            ai_costs: {
                Row: {
                    id: string
                    provider: string | null
                    model: string | null
                    cost_type: string | null
                    unit: string | null
                    cost_per_unit: number | null
                    vendor_cost: number | null
                    margin_percent: number | null
                    is_active: boolean | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    provider?: string | null
                    model?: string | null
                    cost_type?: string | null
                    unit?: string | null
                    cost_per_unit?: number | null
                    vendor_cost?: number | null
                    margin_percent?: number | null
                    is_active?: boolean | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    provider?: string | null
                    model?: string | null
                    cost_type?: string | null
                    unit?: string | null
                    cost_per_unit?: number | null
                    vendor_cost?: number | null
                    margin_percent?: number | null
                    is_active?: boolean | null
                    created_at?: string | null
                    updated_at?: string | null
                }
            }
            ai_models: {
                Row: {
                    id: string
                    provider_id: string | null
                    name: string | null
                    model_id: string | null
                    category: string | null
                    is_enabled: boolean | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    provider_id?: string | null
                    name?: string | null
                    model_id?: string | null
                    category?: string | null
                    is_enabled?: boolean | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    provider_id?: string | null
                    name?: string | null
                    model_id?: string | null
                    category?: string | null
                    is_enabled?: boolean | null
                    created_at?: string | null
                    updated_at?: string | null
                }
            }
            ai_providers: {
                Row: {
                    id: string
                    name: string
                    kind: string
                    enabled: boolean
                    env_key: string
                    base_url: string | null
                    config: Json
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    kind: string
                    enabled?: boolean
                    env_key: string
                    base_url?: string | null
                    config?: Json
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    kind?: string
                    enabled?: boolean
                    env_key?: string
                    base_url?: string | null
                    config?: Json
                    created_at?: string
                    updated_at?: string
                }
            }
            contact_messages: {
                Row: {
                    id: string
                    user_id: string | null
                    email: string | null
                    name: string | null
                    subject: string | null
                    message: string | null
                    status: string | null
                    admin_reply: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    email?: string | null
                    name?: string | null
                    subject?: string | null
                    message?: string | null
                    status?: string | null
                    admin_reply?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    email?: string | null
                    name?: string | null
                    subject?: string | null
                    message?: string | null
                    status?: string | null
                    admin_reply?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
            }
            debates: {
                Row: {
                    id: string
                    user_id: string
                    title: string | null
                    topic: string | null
                    mode: string | null
                    status: string | null
                    final_summary: string | null
                    total_cost_cents: number | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    title?: string | null
                    topic?: string | null
                    mode?: string | null
                    status?: string | null
                    final_summary?: string | null
                    total_cost_cents?: number | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string | null
                    topic?: string | null
                    mode?: string | null
                    status?: string | null
                    final_summary?: string | null
                    total_cost_cents?: number | null
                    created_at?: string | null
                    updated_at?: string | null
                }
            }
            debate_turns: {
                Row: {
                    id: string
                    debate_id: string | null
                    user_id: string | null
                    ai_provider_id: string | null
                    ai_name_snapshot: string | null
                    role: string | null
                    content: string | null
                    meta: Json | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    debate_id?: string | null
                    user_id?: string | null
                    ai_provider_id?: string | null
                    ai_name_snapshot?: string | null
                    role?: string | null
                    content?: string | null
                    meta?: Json | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    debate_id?: string | null
                    user_id?: string | null
                    ai_provider_id?: string | null
                    ai_name_snapshot?: string | null
                    role?: string | null
                    content?: string | null
                    meta?: Json | null
                    created_at?: string | null
                }
            }
            generated_assets: {
                Row: {
                    id: string
                    user_id: string | null
                    debate_id: string | null
                    job_run_id: string | null
                    asset_type: string | null
                    prompt: string | null
                    provider_name: string | null
                    storage_path: string | null
                    public_url: string | null
                    cost_cents: number | null
                    sequence_number: number | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    debate_id?: string | null
                    job_run_id?: string | null
                    asset_type?: string | null
                    prompt?: string | null
                    provider_name?: string | null
                    storage_path?: string | null
                    public_url?: string | null
                    cost_cents?: number | null
                    sequence_number?: number | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    debate_id?: string | null
                    job_run_id?: string | null
                    asset_type?: string | null
                    prompt?: string | null
                    provider_name?: string | null
                    storage_path?: string | null
                    public_url?: string | null
                    cost_cents?: number | null
                    sequence_number?: number | null
                    created_at?: string | null
                }
            }
            job_events: {
                Row: {
                    id: string
                    job_run_id: string | null
                    level: string | null
                    message: string | null
                    payload: Json | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    job_run_id?: string | null
                    level?: string | null
                    message?: string | null
                    payload?: Json | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    job_run_id?: string | null
                    level?: string | null
                    message?: string | null
                    payload?: Json | null
                    created_at?: string | null
                }
            }
            job_runs: {
                Row: {
                    id: string
                    video_job_id: string | null
                    run_type: string | null
                    status: string | null
                    attempt: number | null
                    cloud_run_job_name: string | null
                    cloud_run_execution_id: string | null
                    started_at: string | null
                    finished_at: string | null
                    error_message: string | null
                    metadata: Json | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    video_job_id?: string | null
                    run_type?: string | null
                    status?: string | null
                    attempt?: number | null
                    cloud_run_job_name?: string | null
                    cloud_run_execution_id?: string | null
                    started_at?: string | null
                    finished_at?: string | null
                    error_message?: string | null
                    metadata?: Json | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    video_job_id?: string | null
                    run_type?: string | null
                    status?: string | null
                    attempt?: number | null
                    cloud_run_job_name?: string | null
                    cloud_run_execution_id?: string | null
                    started_at?: string | null
                    finished_at?: string | null
                    error_message?: string | null
                    metadata?: Json | null
                    created_at?: string | null
                }
            }
            notifications: {
                Row: {
                    id: string
                    user_id: string | null
                    title: string | null
                    body: string | null
                    type: string | null
                    is_read: boolean | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    title?: string | null
                    body?: string | null
                    type?: string | null
                    is_read?: boolean | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    title?: string | null
                    body?: string | null
                    type?: string | null
                    is_read?: boolean | null
                    created_at?: string | null
                }
            }
            payment_events: {
                Row: {
                    id: string
                    provider: string | null
                    event_id: string | null
                    processed: boolean | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    provider?: string | null
                    event_id?: string | null
                    processed?: boolean | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    provider?: string | null
                    event_id?: string | null
                    processed?: boolean | null
                    created_at?: string | null
                }
            }
            pending_requests: {
                Row: {
                    id: string
                    user_id: string | null
                    kind: string | null
                    payload: Json | null
                    tokens_required: number | null
                    expires_at: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    kind?: string | null
                    payload?: Json | null
                    tokens_required?: number | null
                    expires_at?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    kind?: string | null
                    payload?: Json | null
                    tokens_required?: number | null
                    expires_at?: string | null
                    created_at?: string | null
                }
            }
            profiles: {
                Row: {
                    id: string
                    email: string | null
                    full_name: string | null
                    role: string | null
                    token_balance: number | null
                    is_banned: boolean | null
                    free_trial_used: boolean | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id: string
                    email?: string | null
                    full_name?: string | null
                    role?: string | null
                    token_balance?: number | null
                    is_banned?: boolean | null
                    free_trial_used?: boolean | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    email?: string | null
                    full_name?: string | null
                    role?: string | null
                    token_balance?: number | null
                    is_banned?: boolean | null
                    free_trial_used?: boolean | null
                    created_at?: string | null
                    updated_at?: string | null
                }
            }
            site_content: {
                Row: {
                    key: string
                    content: string | null
                    locale: string | null
                    updated_at: string | null
                }
                Insert: {
                    key: string
                    content?: string | null
                    locale?: string | null
                    updated_at?: string | null
                }
                Update: {
                    key?: string
                    content?: string | null
                    locale?: string | null
                    updated_at?: string | null
                }
            }
            site_settings: {
                Row: {
                    key: string
                    value: Json | null
                    description: string | null
                    updated_at: string | null
                }
                Insert: {
                    key: string
                    value?: Json | null
                    description?: string | null
                    updated_at?: string | null
                }
                Update: {
                    key?: string
                    value?: Json | null
                    description?: string | null
                    updated_at?: string | null
                }
            }
            story_assets: {
                Row: {
                    id: string
                    video_job_id: string | null
                    entity_id: string | null
                    asset_url: string | null
                    asset_type: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    video_job_id?: string | null
                    entity_id?: string | null
                    asset_url?: string | null
                    asset_type?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    video_job_id?: string | null
                    entity_id?: string | null
                    asset_url?: string | null
                    asset_type?: string | null
                    created_at?: string | null
                }
            }
            story_entities: {
                Row: {
                    id: string
                    video_job_id: string | null
                    name: string | null
                    description: string | null
                    type: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    video_job_id?: string | null
                    name?: string | null
                    description?: string | null
                    type?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    video_job_id?: string | null
                    name?: string | null
                    description?: string | null
                    type?: string | null
                    created_at?: string | null
                }
            }
            story_entity_links: {
                Row: {
                    id: string
                    video_job_id: string | null
                    from_entity_id: string | null
                    to_entity_id: string | null
                    relation_type: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    video_job_id?: string | null
                    from_entity_id?: string | null
                    to_entity_id?: string | null
                    relation_type?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    video_job_id?: string | null
                    from_entity_id?: string | null
                    to_entity_id?: string | null
                    relation_type?: string | null
                    created_at?: string | null
                }
            }
            token_ledger: {
                Row: {
                    id: string
                    user_id: string | null
                    amount: number | null
                    description: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    amount?: number | null
                    description?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    amount?: number | null
                    description?: string | null
                    created_at?: string | null
                }
            }
            token_plans: {
                Row: {
                    id: string
                    name: string | null
                    price_cents: number | null
                    credits_cents: number | null
                    active: boolean | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    name?: string | null
                    price_cents?: number | null
                    credits_cents?: number | null
                    active?: boolean | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    name?: string | null
                    price_cents?: number | null
                    credits_cents?: number | null
                    active?: boolean | null
                    created_at?: string | null
                }
            }
            usage_events: {
                Row: {
                    id: string
                    user_id: string | null
                    event_type: string | null
                    meta: Json | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    event_type?: string | null
                    meta?: Json | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    event_type?: string | null
                    meta?: Json | null
                    created_at?: string | null
                }
            }
            video_jobs: {
                Row: {
                    id: string
                    user_id: string | null
                    debate_id: string | null
                    status: string | null
                    output_url: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    debate_id?: string | null
                    status?: string | null
                    output_url?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    debate_id?: string | null
                    status?: string | null
                    output_url?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
