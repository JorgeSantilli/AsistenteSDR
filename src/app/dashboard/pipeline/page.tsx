'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import {
    Search,
    Filter,
    ChevronDown,
    Calendar,
    Building2,
    User,
    Phone,
    Mail,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    MoreVertical,
    Plus
} from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
import NewDealModal from '@/components/dashboard/NewDealModal'

type Deal = {
    id: string
    title: string
    company: string
    contact_name: string
    contact_email?: string
    stage: string
    value: number
    probability: number
    last_interaction?: string
    due_date?: string
    created_at: string
}

export default function PipelinePage() {
    const [deals, setDeals] = useState<Deal[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStage, setFilterStage] = useState<string>('all')
    const supabase = createClient()

    useEffect(() => {
        loadDeals()
    }, [])

    const loadDeals = async () => {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from('deals')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setDeals((data as any) || [])
        } catch (error) {
            console.error('Error loading deals:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const filteredDeals = deals.filter(deal => {
        const matchesSearch =
            (deal.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (deal.company?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (deal.contact_name?.toLowerCase() || '').includes(searchQuery.toLowerCase())

        const matchesStage = filterStage === 'all' || deal.stage === filterStage

        return matchesSearch && matchesStage
    })

    const getStageColor = (stage: string) => {
        const colors: Record<string, string> = {
            'Discovery': 'bg-blue-100 text-blue-700 border-blue-200',
            'Qualification': 'bg-purple-100 text-purple-700 border-purple-200',
            'Proposal': 'bg-amber-100 text-amber-700 border-amber-200',
            'Negotiation': 'bg-orange-100 text-orange-700 border-orange-200',
            'Closed Won': 'bg-emerald-100 text-emerald-700 border-emerald-200',
            'Closed Lost': 'bg-zinc-100 text-zinc-600 border-zinc-200'
        }
        return colors[stage] || 'bg-zinc-100 text-zinc-600 border-zinc-200'
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
        }).format(value)
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-'
        return new Date(dateString).toLocaleDateString('es-AR', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const getRelativeTime = (dateString?: string) => {
        if (!dateString) return 'Sin interacción'
        const date = new Date(dateString)
        const now = new Date()
        const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

        if (diffInDays === 0) return 'Hoy'
        if (diffInDays === 1) return 'Ayer'
        if (diffInDays < 7) return `Hace ${diffInDays} días`
        return formatDate(dateString)
    }

    return (
        <div className="flex flex-col h-full bg-zinc-50">
            {/* Header */}
            <div className="bg-white border-b border-zinc-200 px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900">Pipeline</h1>
                        <p className="text-sm text-zinc-500 mt-1">
                            {filteredDeals.length} oportunidades activas
                        </p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors active:scale-95"
                    >
                        <Plus size={18} />
                        Nueva Oportunidad
                    </button>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar por cuenta, contacto o deal..."
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                    </div>

                    <select
                        value={filterStage}
                        onChange={(e) => setFilterStage(e.target.value)}
                        className="bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                        <option value="all">Todas las etapas</option>
                        <option value="Discovery">Discovery</option>
                        <option value="Qualification">Qualification</option>
                        <option value="Proposal">Proposal</option>
                        <option value="Negotiation">Negotiation</option>
                        <option value="Closed Won">Closed Won</option>
                        <option value="Closed Lost">Closed Lost</option>
                    </select>

                    <button className="bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors flex items-center gap-2">
                        <Filter size={16} />
                        Más filtros
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
                <table className="w-full">
                    <thead className="bg-zinc-50 border-b border-zinc-200 sticky top-0">
                        <tr>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                                To-do
                            </th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                                Nombre y título
                            </th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                                Última interacción
                            </th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                                Deal
                            </th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                                Etapa
                            </th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                                Valor
                            </th>
                            <th className="text-right px-6 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-zinc-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center">
                                    <div className="flex items-center justify-center gap-2 text-zinc-500">
                                        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                        Cargando oportunidades...
                                    </div>
                                </td>
                            </tr>
                        ) : filteredDeals.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                                    No se encontraron oportunidades
                                </td>
                            </tr>
                        ) : (
                            filteredDeals.map((deal) => (
                                <tr key={deal.id} className="hover:bg-zinc-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-start gap-2">
                                            <input type="checkbox" className="mt-1 rounded border-zinc-300" />
                                            <div className="text-sm">
                                                <p className="text-zinc-900 font-medium mb-1">
                                                    Seguimiento pendiente
                                                </p>
                                                <p className="text-xs text-zinc-500">
                                                    Programado para {formatDate(deal.due_date)}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-sm">
                                                {(deal.contact_name || '?').charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-zinc-900 flex items-center gap-2">
                                                    {deal.contact_name}
                                                    <span className="text-indigo-600 text-xs">📞 1</span>
                                                </p>
                                                <p className="text-sm text-zinc-500">{deal.company}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-zinc-600">
                                            <Clock size={14} className="text-zinc-400" />
                                            {getRelativeTime(deal.last_interaction)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-medium text-zinc-900">{deal.title}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStageColor(deal.stage)}`}>
                                            {deal.stage}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="text-sm font-semibold text-zinc-900">
                                                {formatCurrency(deal.value)}
                                            </p>
                                            <p className="text-xs text-zinc-500">
                                                {deal.probability}% probabilidad
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 hover:bg-zinc-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                            <MoreVertical size={16} className="text-zinc-400" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <NewDealModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={loadDeals}
            />
        </div>
    )
}
