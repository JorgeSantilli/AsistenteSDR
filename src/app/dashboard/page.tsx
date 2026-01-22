'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import {
    Filter,
    ChevronDown,
    MoreHorizontal,
    MessageSquare,
    Phone,
    Mail,
    MonitorPlay,
    XCircle,
    List,
    LayoutGrid,
    RefreshCw
} from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
import NewDealModal from '@/components/dashboard/NewDealModal'

// Types
type Deal = {
    id: string
    title: string
    company: string
    value: number
    stage: string
    probability: number
    last_activity: string
    contact_name: string
    contact_email: string
    status: string
    created_at?: string
}

export default function DashboardPage() {
    const [viewMode, setViewMode] = useState<'list' | 'board'>('list')
    const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [deals, setDeals] = useState<Deal[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const supabase = createClient()

    const fetchDeals = async () => {
        setIsLoading(true)
        const { data } = await supabase
            .from('deals')
            .select('*')
            .order('created_at', { ascending: false })

        if (data) setDeals(data as any)
        setIsLoading(false)
    }

    useEffect(() => {
        fetchDeals()
    }, [])

    const totalPipeline = deals.reduce((acc, deal) => acc + (deal.value || 0), 0)
    const activeDeals = deals.length

    return (
        <>
            <Header title="Pipeline" onNewClick={() => setIsModalOpen(true)} />

            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-zinc-50 p-6">


                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    {[
                        { label: 'Total Pipeline', value: `$${totalPipeline.toLocaleString()}`, count: activeDeals, sub: 'Active Deals', color: 'border-l-zinc-300' },
                        { label: 'Avg Deal Size', value: `$${activeDeals > 0 ? Math.round(totalPipeline / activeDeals).toLocaleString() : 0}`, count: activeDeals, sub: 'Per Deal', active: true, color: 'border-l-indigo-500' },
                        { label: 'Win Rate', value: '0%', count: 0, sub: 'Last 30 days', color: 'border-l-zinc-300' },
                        { label: 'Tasks', value: '0', count: 0, sub: 'Overdue', color: 'border-l-red-500' },
                        { label: 'Closed Won', value: '$0', count: 0, color: 'border-l-emerald-500' },
                    ].map((kpi, idx) => (
                        <div key={idx} className={`bg-white p-4 rounded-xl shadow-sm border border-zinc-200 ${kpi.active ? 'ring-2 ring-indigo-500/20' : ''} ${kpi.color} border-l-4`}>
                            <p className={`text-sm font-medium ${kpi.active ? 'text-indigo-600' : 'text-zinc-500'}`}>{kpi.label}</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-2xl font-bold text-zinc-900">{kpi.value}</span>
                                <span className="text-zinc-400 text-sm">({kpi.count})</span>
                            </div>
                            {kpi.sub && <p className="text-xs text-zinc-400 mt-2">{kpi.sub}</p>}
                        </div>
                    ))}
                </div>

                {/* Filters Bar */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3 overflow-x-auto pb-2">
                        <button className="flex items-center gap-2 bg-white border border-zinc-200 text-zinc-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-zinc-50 shadow-sm">
                            <Filter size={14} /> Filtrost
                        </button>
                        <div className="h-6 w-px bg-zinc-300" />
                        {['Closing this quarter', 'My Accounts', 'Needs Attention'].map(filter => (
                            <button key={filter} className="whitespace-nowrap bg-zinc-100 text-zinc-600 px-3 py-1.5 rounded-lg text-sm hover:bg-zinc-200">
                                {filter} <ChevronDown size={12} className="inline ml-1 opacity-50" />
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2 bg-white p-1 rounded-lg border border-zinc-200 shadow-sm">
                        <button
                            onClick={fetchDeals}
                            className="p-1.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 rounded transition-colors"
                            title="Refrescar"
                        >
                            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50'}`}
                        >
                            <List size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('board')}
                            className={`p-1.5 rounded ${viewMode === 'board' ? 'bg-indigo-50 text-indigo-600' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50'}`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50/50 border-b border-zinc-200 text-xs text-zinc-500 font-semibold uppercase tracking-wider">
                                <th className="px-6 py-4 w-12"></th>
                                <th className="px-6 py-4">Oportunidad / Compañía</th>
                                <th className="px-6 py-4 text-center">Probabilidad</th>
                                <th className="px-6 py-4 text-center">Valor</th>
                                <th className="px-6 py-4">Etapa</th>
                                <th className="px-6 py-4">Contacto</th>
                                <th className="px-6 py-4">Última Actividad</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center text-zinc-400">
                                        Cargando oportunidades...
                                    </td>
                                </tr>
                            ) : deals.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center text-zinc-400">
                                        No se encontraron oportunidades.
                                    </td>
                                </tr>
                            ) : deals.map((deal) => (
                                <tr
                                    key={deal.id}
                                    onClick={() => { setSelectedDeal(deal); setIsDrawerOpen(true) }}
                                    className={`group hover:bg-indigo-50/30 transition-colors cursor-pointer ${selectedDeal?.id === deal.id ? 'bg-indigo-50/50' : ''}`}
                                >
                                    <td className="px-6 py-4">
                                        <button className="text-zinc-300 hover:text-indigo-500">
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-zinc-900 group-hover:text-indigo-600 transition-colors">{deal.title}</span>
                                            <span className="text-xs text-zinc-400">{deal.company}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <span className={`px-2 py-1 rounded text-xs font-bold w-12 text-center ${deal.probability > 70 ? 'bg-emerald-100 text-emerald-700' :
                                                deal.probability > 30 ? 'bg-blue-100 text-blue-700' :
                                                    'bg-zinc-100 text-zinc-600'
                                                }`}>
                                                {deal.probability}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-medium text-zinc-700">
                                        ${deal.value?.toLocaleString() || 0}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${deal.stage === 'Discovery' ? 'bg-purple-100 text-purple-700' :
                                            deal.stage === 'Negotiation' ? 'bg-indigo-100 text-indigo-700' :
                                                'bg-zinc-100 text-zinc-700'
                                            }`}>
                                            {deal.stage}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-zinc-600">{deal.contact_name}</div>
                                        <div className="text-xs text-zinc-400">{deal.contact_email}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-zinc-500">
                                        {deal.created_at ? new Date(deal.created_at).toLocaleDateString() : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            <NewDealModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchDeals}
            />

            {/* Deal Detail Drawer (Side Panel) */}
            {selectedDeal && (
                <div className={`fixed inset-y-0 right-0 w-[600px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-zinc-200 z-50 ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="h-full flex flex-col">
                        <div className="px-6 py-4 border-b border-zinc-200 flex justify-between items-start bg-zinc-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-zinc-900">{selectedDeal.title}</h2>
                                <p className="text-indigo-600 font-medium">{selectedDeal.company}</p>
                            </div>
                            <button onClick={() => setIsDrawerOpen(false)} className="text-zinc-400 hover:text-zinc-600 p-1">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-4 p-6 border-b border-zinc-200">
                                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                                    <p className="text-xs text-emerald-600 uppercase font-bold tracking-wide mb-1">Health Score</p>
                                    <p className="text-2xl font-bold text-emerald-700">{selectedDeal.probability}%</p>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                    <p className="text-xs text-blue-600 uppercase font-bold tracking-wide mb-1">Forecast</p>
                                    <p className="text-2xl font-bold text-blue-700">Pipeline</p>
                                </div>
                                <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                                    <p className="text-xs text-purple-600 uppercase font-bold tracking-wide mb-1">Decision Maker</p>
                                    <p className="text-base font-bold text-purple-700 truncate" title={selectedDeal.contact_name || ''}>{selectedDeal.contact_name}</p>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="px-6 pt-4">
                                <div className="flex gap-6 border-b border-zinc-200">
                                    <button className="pb-3 border-b-2 border-indigo-600 text-indigo-600 font-medium text-sm">Activity Timeline</button>
                                    <button className="pb-3 border-b-2 border-transparent text-zinc-500 hover:text-zinc-700 font-medium text-sm">Contacts</button>
                                    <button className="pb-3 border-b-2 border-transparent text-zinc-500 hover:text-zinc-700 font-medium text-sm">Intelligence</button>
                                </div>
                            </div>

                            {/* Timeline Content */}
                            <div className="p-6 space-y-6">
                                <div className="text-center text-zinc-400 py-10">
                                    <MonitorPlay size={40} className="mx-auto mb-3 opacity-20" />
                                    <p>No activity yet for this deal.</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex justify-end gap-3">
                            <button onClick={() => setIsDrawerOpen(false)} className="px-4 py-2 border border-zinc-300 rounded-lg text-sm font-medium text-zinc-700 hover:bg-white">Close</button>
                            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm shadow-indigo-500/20">Update Stage</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
