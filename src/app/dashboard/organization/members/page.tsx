'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import {
    Users,
    UserPlus,
    Mail,
    Shield,
    MoreVertical,
    Search,
    BadgeCheck,
    Clock,
    RefreshCw
} from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'

/**
 * MembersPage
 * 
 * Interfaz para gestionar los miembros de la organización.
 * Permite ver, invitar y gestionar roles de los usuarios.
 */
export default function MembersPage() {
    const [members, setMembers] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [orgId, setOrgId] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        async function loadData() {
            setIsLoading(true)

            // 1. Obtener organización del usuario
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('organization_id')
                .eq('id', user.id)

            const profile = profiles && profiles.length > 0 ? profiles[0] : null

            if (profile?.organization_id) {
                setOrgId(profile.organization_id)

                // 2. Cargar miembros vinculados a esa organización
                const { data: membersData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('organization_id', profile.organization_id)
                    .order('full_name')

                if (membersData) setMembers(membersData)
            }
            setIsLoading(false)
        }
        loadData()
    }, [])

    return (
        <div className="flex flex-col h-full">
            <Header
                title="Gestión de Equipo"
                onNewClick={() => alert('Próximamente: Invitar nuevo miembro')}
            />

            <main className="flex-1 overflow-y-auto bg-zinc-50 p-6">
                <div className="max-w-6xl mx-auto">

                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-zinc-900">Miembros de la Organización</h1>
                            <p className="text-zinc-500 text-sm mt-1">
                                Administra quién tiene acceso y qué permisos posee en tu cuenta.
                            </p>
                        </div>
                        <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200">
                            <UserPlus size={18} />
                            <span>Invitar Miembro</span>
                        </button>
                    </div>

                    {/* Filters & Search */}
                    <div className="bg-white p-4 rounded-xl border border-zinc-200 mb-6 flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o email..."
                                className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <select className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-600 outline-none focus:ring-2 focus:ring-indigo-500/20">
                                <option>Todos los roles</option>
                                <option>Administrador</option>
                                <option>SDR</option>
                                <option>Viewer</option>
                            </select>
                        </div>
                    </div>

                    {/* Members List */}
                    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50 border-b border-zinc-200 text-xs text-zinc-500 font-bold uppercase tracking-wider">
                                    <th className="px-6 py-4">Usuario</th>
                                    <th className="px-6 py-4">Rol / Cargo</th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-zinc-400">
                                            <RefreshCw size={24} className="animate-spin mx-auto mb-2 opacity-20" />
                                            Cargando miembros...
                                        </td>
                                    </tr>
                                ) : members.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-zinc-400">
                                            No se encontraron miembros en esta organización.
                                        </td>
                                    </tr>
                                ) : members.map((member) => (
                                    <tr key={member.id} className="hover:bg-zinc-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm">
                                                    {member.full_name?.charAt(0) || '?'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-zinc-900">{member.full_name}</span>
                                                    <span className="text-xs text-zinc-500">{member.job_title || 'Sin cargo definido'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Shield size={14} className="text-indigo-500" />
                                                <span className="text-sm text-zinc-600 capitalize">
                                                    {member.role || 'SDR'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                Activo
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors">
                                                <MoreVertical size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Usage Stats (Placeholder) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <Users size={20} />
                                </div>
                                <span className="text-xs font-bold text-zinc-400">Límite: 10</span>
                            </div>
                            <h3 className="text-zinc-500 text-sm font-medium">Asientos Utilizados</h3>
                            <p className="text-2xl font-bold text-zinc-900 mt-1">{members.length}</p>
                            <div className="w-full bg-zinc-100 h-1.5 rounded-full mt-4 overflow-hidden">
                                <div
                                    className="bg-indigo-600 h-full rounded-full"
                                    style={{ width: `${(members.length / 10) * 100}%` }}
                                />
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                    <BadgeCheck size={20} />
                                </div>
                            </div>
                            <h3 className="text-zinc-500 text-sm font-medium">Administradores</h3>
                            <p className="text-2xl font-bold text-zinc-900 mt-1">1</p>
                            <p className="text-xs text-zinc-400 mt-2">Capacidad total para gestionar miembros.</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                                    <Clock size={20} />
                                </div>
                            </div>
                            <h3 className="text-zinc-500 text-sm font-medium">Invitaciones Pendientes</h3>
                            <p className="text-2xl font-bold text-zinc-900 mt-1">0</p>
                            <p className="text-xs text-zinc-400 mt-2">No hay invitaciones esperando respuesta.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
