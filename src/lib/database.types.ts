export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            activities: {
                Row: {
                    content: string
                    created_at: string | null
                    deal_id: string | null
                    id: string
                    metadata: Json | null
                    organization_id: string
                    type: string
                    user_id: string | null
                }
                Insert: {
                    content: string
                    created_at?: string | null
                    deal_id?: string | null
                    id?: string
                    metadata?: Json | null
                    organization_id: string
                    type: string
                    user_id?: string | null
                }
                Update: {
                    content?: string
                    created_at?: string | null
                    deal_id?: string | null
                    id?: string
                    metadata?: Json | null
                    organization_id?: string
                    type?: string
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "activities_deal_id_fkey"
                        columns: ["deal_id"]
                        isOneToOne: false
                        referencedRelation: "deals"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "activities_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "activities_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            contacts: {
                Row: {
                    created_at: string | null
                    email: string | null
                    full_name: string
                    id: string
                    job_title: string | null
                    notes: string | null
                    organization_id: string
                    phone: string | null
                }
                Insert: {
                    created_at?: string | null
                    email?: string | null
                    full_name: string
                    id?: string
                    job_title?: string | null
                    notes?: string | null
                    organization_id: string
                    phone?: string | null
                }
                Update: {
                    created_at?: string | null
                    email?: string | null
                    full_name?: string
                    id?: string
                    job_title?: string | null
                    notes?: string | null
                    organization_id?: string
                    phone?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "contacts_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
            }
            deal_contacts: {
                Row: {
                    contact_id: string
                    created_at: string | null
                    deal_id: string
                    id: string
                    is_primary: boolean | null
                    role: string | null
                }
                Insert: {
                    contact_id: string
                    created_at?: string | null
                    deal_id: string
                    id?: string
                    is_primary?: boolean | null
                    role?: string | null
                }
                Update: {
                    contact_id?: string
                    created_at?: string | null
                    deal_id?: string
                    id?: string
                    is_primary?: boolean | null
                    role?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "deal_contacts_contact_id_fkey"
                        columns: ["contact_id"]
                        isOneToOne: false
                        referencedRelation: "contacts"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "deal_contacts_deal_id_fkey"
                        columns: ["deal_id"]
                        isOneToOne: false
                        referencedRelation: "deals"
                        referencedColumns: ["id"]
                    },
                ]
            }
            deals: {
                Row: {
                    company: string
                    contact_email: string | null
                    contact_name: string
                    contact_phone: string | null
                    created_at: string | null
                    id: string
                    last_activity: string | null
                    organization_id: string
                    probability: number | null
                    stage: string
                    status: string | null
                    title: string
                    tracking_config: Json | null
                    value: number | null
                }
                Insert: {
                    company: string
                    contact_email?: string | null
                    contact_name: string
                    contact_phone?: string | null
                    created_at?: string | null
                    id?: string
                    last_activity?: string | null
                    organization_id: string
                    probability?: number | null
                    stage: string
                    status?: string | null
                    title: string
                    tracking_config?: Json | null
                    value?: number | null
                }
                Update: {
                    company?: string
                    contact_email?: string | null
                    contact_name?: string
                    contact_phone?: string | null
                    created_at?: string | null
                    id?: string
                    last_activity?: string | null
                    organization_id?: string
                    probability?: number | null
                    stage?: string
                    status?: string | null
                    title?: string
                    tracking_config?: Json | null
                    value?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "deals_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
            }
            interactions: {
                Row: {
                    audio_url: string | null
                    created_at: string | null
                    deal_id: string | null
                    duration_seconds: number | null
                    id: string
                    notes: string | null
                    organization_id: string
                    status: string | null
                    transcript_full: string | null
                }
                Insert: {
                    audio_url?: string | null
                    created_at?: string | null
                    deal_id?: string | null
                    duration_seconds?: number | null
                    id?: string
                    notes?: string | null
                    organization_id: string
                    status?: string | null
                    transcript_full?: string | null
                }
                Update: {
                    audio_url?: string | null
                    created_at?: string | null
                    deal_id?: string | null
                    duration_seconds?: number | null
                    id?: string
                    notes?: string | null
                    organization_id?: string
                    status?: string | null
                    transcript_full?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "interactions_deal_id_fkey"
                        columns: ["deal_id"]
                        isOneToOne: false
                        referencedRelation: "deals"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "interactions_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
            }
            knowledge_base: {
                Row: {
                    content: string | null
                    created_at: string | null
                    file_name: string
                    file_url: string | null
                    id: string
                    metadata: Json | null
                    organization_id: string
                    title: string
                    type: string | null
                }
                Insert: {
                    content?: string | null
                    created_at?: string | null
                    file_name: string
                    file_url?: string | null
                    id?: string
                    metadata?: Json | null
                    organization_id: string
                    title: string
                    type?: string | null
                }
                Update: {
                    content?: string | null
                    created_at?: string | null
                    file_name?: string
                    file_url?: string | null
                    id?: string
                    metadata?: Json | null
                    organization_id?: string
                    title?: string
                    type?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "knowledge_base_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
            }
            organizations: {
                Row: {
                    created_at: string | null
                    id: string
                    name: string
                    settings: Json | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    name: string
                    settings?: Json | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    name?: string
                    settings?: Json | null
                }
                Relationships: []
            }
            profiles: {
                Row: {
                    created_at: string | null
                    full_name: string | null
                    id: string
                    organization_id: string | null
                    role: string | null
                }
                Insert: {
                    created_at?: string | null
                    full_name?: string | null
                    id: string
                    organization_id?: string | null
                    role?: string | null
                }
                Update: {
                    created_at?: string | null
                    full_name?: string | null
                    id?: string
                    organization_id?: string | null
                    role?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
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
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
