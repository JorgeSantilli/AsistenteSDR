'use client'

import React, { useState, useEffect } from 'react'
import {
    User,
    Bell,
    Shield,
    Building,
    Save,
    ToggleLeft,
    ToggleRight,
    Loader2
} from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
import { Database } from '@/lib/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type Organization = Database['public']['Tables']['organizations']['Row']

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('account')
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [organization, setOrganization] = useState<Organization | null>(null)
    const supabase = createClient()

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Load Profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            setProfile(profileData)

            // Load Organization if linked
            if (profileData?.organization_id) {
                const { data: orgData } = await supabase
                    .from('organizations')
                    .select('*')
                    .eq('id', profileData.organization_id)
                    .single()
                setOrganization(orgData)
            }
        } catch (error) {
            console.error('Error loading settings:', error)
        } finally {
            setLoading(false)
        }
    }

    const tabs = [
        { id: 'account', label: 'Mi Cuenta', icon: User },
        { id: 'notifications', label: 'Notificaciones', icon: Bell },
        { id: 'organization', label: 'Organización', icon: Building },
        { id: 'security', label: 'Seguridad', icon: Shield },
    ]

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center bg-zinc-50">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-zinc-50 overflow-y-auto">
            <div className="bg-white border-b border-zinc-200 px-8 py-6">
                <h1 className="text-2xl font-bold text-zinc-900">Configuración</h1>
                <p className="text-sm text-zinc-500 mt-1">Administra tu cuenta y preferencias de la aplicación</p>
            </div>

            <div className="flex-1 p-8 max-w-6xl mx-auto w-full">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar Tabs */}
                    <div className="w-full md:w-64 flex-shrink-0">
                        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                            {tabs.map((tab) => {
                                const Icon = tab.icon
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-2 ${activeTab === tab.id
                                                ? 'bg-indigo-50 text-indigo-700 border-indigo-600'
                                                : 'text-zinc-600 hover:bg-zinc-50 border-transparent hover:text-zinc-900'
                                            }`}
                                    >
                                        <Icon size={18} />
                                        {tab.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1">
                        {activeTab === 'account' && <AccountSettings profile={profile} />}
                        {activeTab === 'notifications' && <NotificationSettings profile={profile} />}
                        {activeTab === 'organization' && <OrganizationSettings organization={organization} profile={profile} />}
                        {activeTab === 'security' && <SecuritySettings />}
                    </div>
                </div>
            </div>
        </div>
    )
}

function AccountSettings({ profile }: { profile: Profile | null }) {
    const supabase = createClient()
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        full_name: profile?.full_name || '',
        job_title: profile?.job_title || ''
    })

    const handleSave = async () => {
        if (!profile) return
        setSaving(true)
        try {
            await supabase.from('profiles').update({
                full_name: formData.full_name,
                job_title: formData.job_title
            }).eq('id', profile.id)

            // alert('Perfil actualizado') 
        } catch (e) {
            console.error(e)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 mb-6">Información Personal</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Nombre Completo</label>
                    <input
                        type="text"
                        value={formData.full_name}
                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full bg-white border border-zinc-300 rounded-lg px-4 py-2.5 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Cargo / Rol</label>
                    <input
                        type="text"
                        value={formData.job_title}
                        onChange={e => setFormData({ ...formData, job_title: e.target.value })}
                        className="w-full bg-white border border-zinc-300 rounded-lg px-4 py-2.5 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                </div>
            </div>

            <div className="flex items-center justify-end pt-6 border-t border-zinc-100">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    Guardar Cambios
                </button>
            </div>
        </div>
    )
}

function NotificationSettings({ profile }: { profile: Profile | null }) {
    // Ideally this would save to profile.preferences jsonb
    return (
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 mb-6">Preferencias de Notificaciones</h2>

            <div className="space-y-6">
                <NotificationToggle
                    title="Resumen Diario de Llamadas"
                    description="Recibe un email con las métricas de tus llamadas al final del día."
                    defaultChecked={true}
                />
                <NotificationToggle
                    title="Alertas de Oportunidades"
                    description="Notificar cuando la IA detecte una alta probabilidad de cierre."
                    defaultChecked={true}
                />
            </div>
        </div>
    )
}

function NotificationToggle({ title, description, defaultChecked }: any) {
    const [enabled, setEnabled] = useState(defaultChecked)

    return (
        <div className="flex items-start justify-between py-4 border-b border-zinc-100 last:border-0">
            <div>
                <h3 className="text-base font-medium text-zinc-900">{title}</h3>
                <p className="text-sm text-zinc-500 mt-1">{description}</p>
            </div>
            <button
                onClick={() => setEnabled(!enabled)}
                className={`flex items-center transition-colors ${enabled ? 'text-indigo-600' : 'text-zinc-300'}`}
            >
                {enabled ? <ToggleRight size={40} className="fill-current" /> : <ToggleLeft size={40} className="fill-current" />}
            </button>
        </div>
    )
}

function OrganizationSettings({ organization, profile }: { organization: Organization | null, profile: Profile | null }) {
    return (
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 mb-6">Configuración de Organización</h2>

            <div className="grid grid-cols-1 gap-6 mb-8">
                <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Nombre de la Empresa</label>
                    <input
                        type="text"
                        defaultValue={organization?.name || 'Mi Organización'}
                        disabled
                        className="w-full bg-gray-50 border border-zinc-300 rounded-lg px-4 py-2.5 text-zinc-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-zinc-400 mt-1">Contacta al administrador para cambiar esto.</p>
                </div>
            </div>
        </div>
    )
}

function SecuritySettings() {
    return (
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 mb-6">Seguridad</h2>
            <div className="text-center py-8 text-zinc-500">
                <Shield size={48} className="mx-auto mb-4 opacity-20" />
                <p>La configuración de seguridad es gestionada por el proveedor de autenticación.</p>
            </div>
        </div>
    )
}
