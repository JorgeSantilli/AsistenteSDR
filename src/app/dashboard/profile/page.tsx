'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import {
    Camera,
    MapPin,
    Link as LinkIcon,
    Twitter,
    Linkedin,
    Mail,
    Phone,
    Award,
    Loader2
} from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
import { Database } from '@/lib/database.types'
import Link from 'next/link'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function ProfilePage() {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        loadProfile()
    }, [])

    const loadProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            setProfile(data)
        } catch (error) {
            console.error('Error loading profile:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center bg-zinc-50">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-zinc-50 overflow-y-auto pb-12">
            {/* Cover Image */}
            <div className="h-48 bg-gradient-to-r from-indigo-600 to-purple-600 relative">
                <button className="absolute bottom-4 right-8 bg-black/30 hover:bg-black/50 text-white px-3 py-1.5 rounded-lg text-sm font-medium backdrop-blur-sm transition-colors flex items-center gap-2">
                    <Camera size={16} /> Editar Portada
                </button>
            </div>

            <div className="max-w-5xl mx-auto px-8 w-full">
                <div className="flex flex-col md:flex-row gap-8 items-start -mt-16 mb-8">
                    {/* Avatar */}
                    <div className="relative">
                        <div className="w-32 h-32 bg-white rounded-full p-1 shadow-xl">
                            <div className="w-full h-full bg-indigo-100 rounded-full flex items-center justify-center text-3xl font-bold text-indigo-600 overflow-hidden relative group cursor-pointer">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span>{profile?.full_name?.substring(0, 2).toUpperCase() || 'JS'}</span>
                                )}
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="text-white" size={24} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="flex-1 pt-16 md:pt-20">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-zinc-900">{profile?.full_name || 'Usuario'}</h1>
                                <p className="text-zinc-500 font-medium">{profile?.job_title || 'SDR'}</p>
                            </div>
                            <Link href="/dashboard/settings" className="bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 px-4 py-2 rounded-lg font-medium shadow-sm transition-all md:mt-0 mt-4">
                                Editar Perfil
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                        {/* About */}
                        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                            <h3 className="font-bold text-zinc-900 mb-4">Sobre Mí</h3>
                            <div className="space-y-3 text-sm text-zinc-600">
                                <div className="flex items-center gap-3">
                                    <MapPin size={18} className="text-zinc-400" />
                                    Buenos Aires, Argentina
                                </div>
                                <div className="flex items-center gap-3">
                                    <Mail size={18} className="text-zinc-400" />
                                    email@ejemplo.com
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone size={18} className="text-zinc-400" />
                                    +54 9 11 1234-5678
                                </div>
                                <div className="flex items-center gap-3">
                                    <LinkIcon size={18} className="text-zinc-400" />
                                    <a href="#" className="text-indigo-600 hover:underline">miweb.com</a>
                                </div>
                            </div>

                            <hr className="my-6 border-zinc-100" />

                            <div className="flex gap-4">
                                <a href="#" className="p-2 bg-zinc-50 rounded-lg text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                                    <Linkedin size={20} />
                                </a>
                                <a href="#" className="p-2 bg-zinc-50 rounded-lg text-zinc-500 hover:text-sky-500 hover:bg-sky-50 transition-colors">
                                    <Twitter size={20} />
                                </a>
                            </div>
                        </div>

                        {/* Achievements */}
                        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                            <h3 className="font-bold text-zinc-900 mb-4">Logros</h3>
                            <div className="space-y-4">
                                <Achievement
                                    title="Top Closer"
                                    date="Dic 2025"
                                    description="Mayor tasa de cierre en Q4"
                                    color="text-amber-500"
                                    bg="bg-amber-50"
                                />
                                <Achievement
                                    title="Llamada Perfecta"
                                    date="15 Ene 2026"
                                    description="100% de cumplimiento en script"
                                    color="text-indigo-500"
                                    bg="bg-indigo-50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Main Column */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Stats Summary */}
                        <div className="grid grid-cols-3 gap-4">
                            <StatCard label="Llamadas Totales" value="1,248" />
                            <StatCard label="Tasa de Éxito" value="24%" highlight />
                            <StatCard label="Horas Habladas" value="86h" />
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                            <h3 className="font-bold text-zinc-900 mb-6">Actividad Reciente</h3>
                            <div className="space-y-6">
                                <ActivityItem
                                    title="Llamada de Venta con Hotel Grand Lux"
                                    time="Hace 2 horas"
                                    type="call"
                                    result="Exitosa"
                                />
                                <ActivityItem
                                    title="Actualización de Perfil"
                                    time="Hace 1 día"
                                    type="system"
                                />
                                <ActivityItem
                                    title="Nuevo record de llamadas diarias"
                                    time="Hace 3 días"
                                    type="achievement"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({ label, value, highlight }: any) {
    return (
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm text-center">
            <div className={`text-2xl font-bold mb-1 ${highlight ? 'text-indigo-600' : 'text-zinc-900'}`}>
                {value}
            </div>
            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                {label}
            </div>
        </div>
    )
}

function Achievement({ title, date, description, color, bg }: any) {
    return (
        <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${bg} ${color}`}>
                <Award size={18} />
            </div>
            <div>
                <h4 className="font-medium text-zinc-900 text-sm">{title}</h4>
                <p className="text-xs text-zinc-500">{description}</p>
                <span className="text-[10px] text-zinc-400 mt-0.5 block">{date}</span>
            </div>
        </div>
    )
}

function ActivityItem({ title, time, type, result }: any) {
    return (
        <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-zinc-200" />
            <div className="flex-1">
                <h4 className="text-sm font-medium text-zinc-900">{title}</h4>
                <p className="text-xs text-zinc-500">{time}</p>
            </div>
            {result && (
                <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
                    {result}
                </span>
            )}
        </div>
    )
}
