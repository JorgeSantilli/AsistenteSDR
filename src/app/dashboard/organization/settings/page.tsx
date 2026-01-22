'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import {
    Building2,
    Save,
    Globe,
    MessageCircle,
    Sparkles,
    Bot,
    Languages,
    Key
} from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'

/**
 * OrgSettingsPage
 * 
 * Configuración global de la organización.
 * Incluye nombre de la empresa, preferencias de IA y llaves de integración.
 */
export default function OrgSettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [orgData, setOrgData] = useState<any>({
        name: '',
        settings: {
            industry: '',
            default_tone: 'Profesional',
            ai_model: 'gpt-4o',
            language: 'Spanish'
        }
    })

    const supabase = createClient()

    useEffect(() => {
        async function loadOrg() {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('organization_id')
                .eq('id', user.id)

            const profile = profiles && profiles.length > 0 ? profiles[0] : null

            if (profile?.organization_id) {
                const { data: orgs } = await supabase
                    .from('organizations')
                    .select('*')
                    .eq('id', profile.organization_id)

                const org = orgs && orgs.length > 0 ? orgs[0] : null

                if (org) {
                    setOrgData({
                        ...org,
                        settings: {
                            industry: '',
                            default_tone: 'Profesional',
                            ai_model: 'gpt-4o',
                            language: 'Spanish',
                            ...(org.settings as any || {})
                        }
                    })
                }
            }
            setLoading(false)
        }
        loadOrg()
    }, [])

    const handleSave = async () => {
        if (!orgData.id) {
            alert('Error: No se ha cargado una organización válida.')
            return
        }

        setSaving(true)
        try {
            const { error } = await supabase
                .from('organizations')
                .update({
                    name: orgData.name,
                    settings: orgData.settings
                })
                .eq('id', orgData.id)

            if (error) throw error
            alert('Configuración guardada correctamente')
        } catch (e: any) {
            console.error('Error saving organization settings:', e)
            alert(`Error al guardar: ${e.message || 'Error desconocido'}`)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col h-full">
                <Header title="Configuración de Organización" />
                <div className="flex-1 flex items-center justify-center bg-zinc-50">
                    <p className="text-zinc-400">Cargando configuración...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            <Header title="Configuración de Organización" onNewClick={handleSave} />

            <main className="flex-1 overflow-y-auto bg-zinc-50 p-6 pb-20">
                <div className="max-w-4xl mx-auto">

                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-16 w-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <Building2 size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-zinc-900">Ajustes de Cuenta</h1>
                            <p className="text-zinc-500 text-sm">Gestiona la identidad y comportamiento de tu organización.</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Perfil de Organización */}
                        <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
                                <Globe size={18} className="text-zinc-400" />
                                <h3 className="font-bold text-zinc-800">Identidad de la Empresa</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-zinc-700 mb-1">Nombre de la Organización</label>
                                    <input
                                        type="text"
                                        value={orgData.name}
                                        onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="Ej: Pxsol"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-zinc-700 mb-1">Industria / Sector</label>
                                    <input
                                        type="text"
                                        value={orgData.settings.industry}
                                        onChange={(e) => setOrgData({
                                            ...orgData,
                                            settings: { ...orgData.settings, industry: e.target.value }
                                        })}
                                        className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="Ej: Hotelería"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Configuración de IA */}
                        <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
                                <Sparkles size={18} className="text-zinc-400" />
                                <h3 className="font-bold text-zinc-800">Personalidad de la IA (Co-Piloto)</h3>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700 mb-2">
                                            <MessageCircle size={16} />
                                            Tono por Defecto
                                        </label>
                                        <select
                                            value={orgData.settings.default_tone}
                                            onChange={(e) => setOrgData({
                                                ...orgData,
                                                settings: { ...orgData.settings, default_tone: e.target.value }
                                            })}
                                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        >
                                            <option>Profesional / Consultivo</option>
                                            <option>Agresivo / Enfocado a Cierre</option>
                                            <option>Amigable / Relacional</option>
                                            <option>Directo / Conciso</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700 mb-2">
                                            <Bot size={16} />
                                            Modelo de Lenguaje
                                        </label>
                                        <select
                                            value={orgData.settings.ai_model}
                                            onChange={(e) => setOrgData({
                                                ...orgData,
                                                settings: { ...orgData.settings, ai_model: e.target.value }
                                            })}
                                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        >
                                            <option value="gpt-4o">GPT-4o (Recomendado)</option>
                                            <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                            <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Rápido)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 border-l-4 border-l-indigo-500">
                                    <p className="text-xs text-indigo-700 leading-relaxed">
                                        <strong>Nota:</strong> Estos ajustes afectan la generación de sugerencias en tiempo real para todos los SDRs de tu equipo.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Integraciones & API (Preview) */}
                        <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
                                <Key size={18} className="text-zinc-400" />
                                <h3 className="font-bold text-zinc-800">API & Integraciones</h3>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center justify-between p-4 border border-zinc-100 rounded-xl hover:bg-zinc-50 transition-colors cursor-not-allowed opacity-60">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-zinc-100 rounded flex items-center justify-center font-bold text-zinc-400">n</div>
                                        <div>
                                            <p className="text-sm font-bold text-zinc-700">Webhook n8n</p>
                                            <p className="text-xs text-zinc-400">Gestiona la ingesta automática de datos.</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-zinc-400 uppercase">Coming Soon</span>
                                </div>
                            </div>
                        </section>

                        {/* Botones de Acción */}
                        <div className="pt-4 flex justify-end gap-3">
                            <button className="px-6 py-2 border border-zinc-300 rounded-xl font-medium text-zinc-600 hover:bg-white transition-colors">
                                Descartar Cambios
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-8 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
                            >
                                {saving ? 'Guardando...' : <><Save size={18} /> Guardar Configuración</>}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
