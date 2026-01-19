'use client'

import React, { useState } from 'react'
import Header from '@/components/layout/Header'
import {
    Filter,
    ChevronDown,
    MoreHorizontal,
    MessageSquare,
    Phone,
    Mail,
    Calendar,
    AlertTriangle,
    ArrowRight,
    MonitorPlay,
    CheckCircle2,
    XCircle,
    Clock
} from 'lucide-react'

// Mock Data matching the screenshot style
const PIPELINE_DATA = [
    { id: 1, name: 'BitForge', product: 'BitForge 1.0', amount: '$56,000', closeDate: 'Feb 27, 2026', forecast: 'Commit', stage: 'Discovery', score: 19, warnings: 3, contacts: 1, owner: 'Alex Castillo', activities: [1, 1, 0, 2, 1, 0, 1], nextCall: '-' },
    { id: 2, name: 'ApexMind', product: 'ApexMind 1.0', amount: '$47,000', closeDate: 'Mar 9, 2026', forecast: 'Commit', stage: 'Qualification', score: 34, warnings: 0, contacts: 3, owner: 'Alex Castillo', activities: [0, 2, 1, 0, 3, 0, 0], nextCall: 'In 3 days' },
    { id: 3, name: 'Exempla', product: 'Exempla 1.0', amount: '$53,000', closeDate: 'Feb 24, 2026', forecast: 'Commit', stage: 'Presentation', score: 76, warnings: 0, contacts: 2, owner: 'Alex Castillo', activities: [0, 0, 1, 1, 0, 2, 0], nextCall: 'Tomorrow' },
    { id: 4, name: 'Credax', product: 'Credax 1.0', amount: '$75,000', closeDate: 'Feb 26, 2026', forecast: 'Best Case', stage: 'Alignment', score: 84, warnings: 0, contacts: 3, owner: 'Alex Castillo', activities: [2, 1, 2, 0, 1, 1, 0], nextCall: 'Tomorrow' },
    { id: 5, name: 'Novus', product: 'Novus 2.0', amount: '$120,000', closeDate: 'Apr 15, 2026', forecast: 'Pipeline', stage: 'Discovery', score: 45, warnings: 1, contacts: 4, owner: 'Sarah Jones', activities: [1, 0, 0, 1, 0, 0, 0], nextCall: 'In 5 days' },
]

export default function PipelinePage() {
    const [selectedDeal, setSelectedDeal] = useState<number | null>(null)

    return (
        <>
            <Header title="Pipeline" />

            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-zinc-50 p-6">

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    {[
                        { label: 'Open', value: '$1.1M', count: 40, sub: '$727.8K (30)', color: 'border-l-zinc-300' },
                        { label: 'Commit', value: '$231K', count: 4, sub: '▲ $56K (1)', active: true, color: 'border-l-indigo-500' },
                        { label: 'Most Likely', value: '$120.5K', count: 5, sub: '▲ $94K (4)', color: 'border-l-zinc-300' },
                        { label: 'Best Case', value: '$356.8K', count: 15, sub: '▲ $294.8K (13)', color: 'border-l-zinc-300' },
                        { label: 'Closed Won', value: '$245.5K', count: 9, color: 'border-l-emerald-500' },
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
                            <Filter size={14} /> Filtros
                        </button>
                        <div className="h-6 w-px bg-zinc-300" />
                        {['Closing this quarter', 'My Accounts', 'Needs Attention'].map(filter => (
                            <button key={filter} className="whitespace-nowrap bg-zinc-100 text-zinc-600 px-3 py-1.5 rounded-lg text-sm hover:bg-zinc-200">
                                {filter} <ChevronDown size={12} className="inline ml-1 opacity-50" />
                            </button>
                        ))}
                        <button className="text-indigo-600 text-sm font-medium hover:underline">+ Add filter</button>
                    </div>

                    <div className="flex gap-2 bg-white p-1 rounded-lg border border-zinc-200 shadow-sm">
                        <button className="p-1.5 bg-indigo-50 text-indigo-600 rounded">
                            <List size={18} />
                        </button>
                        <button className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 rounded">
                            <LayoutGrid size={18} />
                        </button>
                    </div>
                </div>

                {/* Main Table */}
                <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50/50 border-b border-zinc-200 text-xs text-zinc-500 font-semibold uppercase tracking-wider">
                                <th className="px-6 py-4 w-12"></th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4 text-center">Score</th>
                                <th className="px-6 py-4 text-center">Amount</th>
                                <th className="px-6 py-4">Stage</th>
                                <th className="px-6 py-4">Activity</th>
                                <th className="px-6 py-4">Owner</th>
                                <th className="px-6 py-4">Next Call</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {PIPELINE_DATA.map((deal) => (
                                <tr
                                    key={deal.id}
                                    onClick={() => setSelectedDeal(deal.id)}
                                    className={`group hover:bg-indigo-50/30 transition-colors cursor-pointer ${selectedDeal === deal.id ? 'bg-indigo-50/50' : ''}`}
                                >
                                    <td className="px-6 py-4">
                                        <button className="text-zinc-300 hover:text-indigo-500">
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-zinc-900 group-hover:text-indigo-600 transition-colors">{deal.name}</span>
                                            <span className="text-xs text-zinc-400">{deal.product}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <span className={`px-2 py-1 rounded text-xs font-bold w-9 text-center ${deal.score > 70 ? 'bg-emerald-100 text-emerald-700' :
                                                    deal.score > 30 ? 'bg-zinc-100 text-zinc-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                {deal.score}
                                            </span>
                                            {deal.warnings > 0 && (
                                                <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                                    <AlertTriangle size={10} /> {deal.warnings}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-medium text-zinc-700">
                                        {deal.amount}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${deal.stage === 'Discovery' ? 'bg-purple-100 text-purple-700' :
                                                deal.stage === 'Presentation' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-zinc-100 text-zinc-700'
                                            }`}>
                                            {deal.stage}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1">
                                            {deal.activities.map((act, i) => (
                                                <div
                                                    key={i}
                                                    className={`w-2 h-2 rounded-full ${act === 0 ? 'bg-zinc-200' :
                                                            act === 1 ? 'bg-indigo-400' :
                                                                'bg-pink-500'
                                                        }`}
                                                    title="Activity logged"
                                                />
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold border border-indigo-200">
                                                {deal.owner.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <span className="text-sm text-zinc-600">{deal.owner}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-zinc-500">
                                        {deal.nextCall}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* Side Panel (Deal Detail Drawer) - "Gong Style" */}
            {selectedDeal && (
                <div className="fixed inset-y-0 right-0 w-[500px] bg-white shadow-2xl border-l border-zinc-200 transform transition-transform duration-300 overflow-y-auto z-30">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-zinc-900">{PIPELINE_DATA.find(d => d.id === selectedDeal)?.name}</h2>
                                <p className="text-sm text-zinc-500">Última actividad: Hace 2 horas</p>
                            </div>
                            <button onClick={() => setSelectedDeal(null)} className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400">
                                <ArrowRight size={20} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-zinc-200 mb-6">
                            {['Score', 'Contacts', 'Warnings', 'Activity', 'Playbook'].map((tab, i) => (
                                <button
                                    key={tab}
                                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${i === 3 ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Activity Feed */}
                        <div className="space-y-6">
                            {/* Activity Item 1 */}
                            <div className="relative pl-6 border-l-2 border-indigo-100">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white shadow-sm" />
                                <div className="mb-1 flex items-center justify-between">
                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">Call Brief</span>
                                    <span className="text-xs text-zinc-400">Mon, Feb 19 • 10:37 AM</span>
                                </div>
                                <h3 className="font-semibold text-zinc-900">Stakeholder Alignment with BitForge</h3>
                                <div className="flex items-center gap-2 mt-2 mb-3">
                                    <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-[10px] font-bold">AC</div>
                                    <span className="text-xs text-zinc-500">Alex Castillo</span>
                                    <span className="text-zinc-300">•</span>
                                    <div className="w-5 h-5 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-[10px] font-bold">MA</div>
                                    <span className="text-xs text-zinc-500">Mike Allen (BitForge)</span>
                                </div>

                                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 text-sm text-zinc-600 leading-relaxed">
                                    <p className="mb-2">
                                        Alex discussed BitForge's cloud storage needs, including scalability, real-time data analysis, and machine learning capabilities.
                                    </p>
                                    <p>
                                        <strong>Next Steps:</strong> Calculate potential ROI and schedule a technical deep dive.
                                    </p>
                                    <div className="mt-4 flex gap-2">
                                        <button className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded hover:bg-emerald-100 transition-colors">
                                            <CheckCircle2 size={12} /> Mark as Done
                                        </button>
                                        <button className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded hover:bg-indigo-100 transition-colors">
                                            <MonitorPlay size={12} /> Watch Recording
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Activity Item 2 */}
                            <div className="relative pl-6 border-l-2 border-zinc-100">
                                <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-zinc-300" />
                                <div className="mb-1">
                                    <span className="text-xs text-zinc-400">Feb 14 • 2:15 PM</span>
                                </div>
                                <h3 className="font-medium text-zinc-700">Email sent to Sarah Connors</h3>
                                <p className="text-sm text-zinc-500 mt-1">Re: Follow up on implementation timeline...</p>
                            </div>
                        </div>

                        {/* Quick Actions Footer */}
                        <div className="mt-8 border-t border-zinc-200 pt-6">
                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Recommended Actions</h4>
                            <div className="space-y-3">
                                <button className="w-full flex items-center justify-between p-3 bg-white border border-indigo-200 rounded-lg hover:border-indigo-400 hover:shadow-sm transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600 group-hover:bg-indigo-100">
                                            <Phone size={18} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-medium text-zinc-900">Start Live SDR Session</p>
                                            <p className="text-xs text-zinc-500">Prepare for next call</p>
                                        </div>
                                    </div>
                                    <ArrowRight size={16} className="text-zinc-300 group-hover:text-indigo-500" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
