'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import {
    BarChart3,
    TrendingUp,
    Users,
    Clock,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Filter,
    Download,
    Loader2,
    Shield
} from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
import { Database } from '@/lib/database.types'

type Interaction = Database['public']['Tables']['interactions']['Row']

export default function ReportsPage() {
    const [period, setPeriod] = useState('This Week')
    const [loading, setLoading] = useState(true)
    const [metrics, setMetrics] = useState({
        totalCalls: 0,
        successRate: 0,
        avgDuration: '0s',
        objectionsHandled: 0 // Placeholder until we have this data
    })
    const list = useState<Interaction[]>([])
    const supabase = createClient()

    useEffect(() => {
        loadMetrics()
    }, [period])

    const loadMetrics = async () => {
        setLoading(true)
        try {
            const { data: interactions } = await supabase
                .from('interactions')
                .select('*')
                .order('created_at', { ascending: false })

            if (!interactions) {
                setLoading(false)
                return
            }

            // Calculate Metrics
            const total = interactions.length
            const success = interactions.filter(i => i.status === 'SUCCESS').length
            const durationSum = interactions.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0)
            const avgDurSeconds = total > 0 ? Math.floor(durationSum / total) : 0

            // Format Duration
            const mins = Math.floor(avgDurSeconds / 60)
            const secs = avgDurSeconds % 60
            const avgDurationFormatted = `${mins}m ${secs}s`

            setMetrics({
                totalCalls: total,
                successRate: total > 0 ? Math.floor((success / total) * 100) : 0,
                avgDuration: avgDurationFormatted,
                objectionsHandled: 0 // We don't have objection tracking yet
            })

            // setRecentActivity(interactions.slice(0, 5))

        } catch (error) {
            console.error('Error loading reports:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-zinc-50 overflow-y-auto">
            {/* Header */}
            <header className="bg-white border-b border-zinc-200 px-8 py-5 flex items-center justify-between sticky top-0 z-10">
                <div>
                    <h1 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                        <BarChart3 className="text-indigo-600" size={24} />
                        Reportes de Desempeño
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
                            <Calendar size={16} className="text-zinc-500" />
                            {period}
                        </button>
                    </div>
                </div>
            </header>

            <main className="p-8 max-w-7xl mx-auto w-full space-y-8">
                {/* KPI Cards */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-indigo-600" size={32} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <KpiCard
                            title="Llamadas Totales"
                            value={metrics.totalCalls.toString()}
                            change={metrics.totalCalls > 0 ? "+100%" : "0%"}
                            trend={metrics.totalCalls > 0 ? "up" : "neutral"}
                            icon={Users}
                            color="blue"
                        />
                        <KpiCard
                            title="Tasa de Éxito"
                            value={`${metrics.successRate}%`}
                            change="0%"
                            trend="neutral"
                            icon={TrendingUp}
                            color="emerald"
                        />
                        <KpiCard
                            title="Duración Promedio"
                            value={metrics.avgDuration}
                            change="0%"
                            trend="neutral"
                            icon={Clock}
                            color="amber"
                            inverseTrend // Lower is better for handle time? Maybe not for sales. Let's assume neutral.
                        />
                        <KpiCard
                            title="Objeciones Superadas"
                            value={metrics.objectionsHandled.toString()}
                            change="0%"
                            trend="neutral"
                            icon={Shield}
                            color="purple"
                        />
                    </div>
                )}

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Chart */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-zinc-900">Actividad de Llamadas</h3>
                            <button className="text-zinc-400 hover:text-zinc-600">
                                <Filter size={18} />
                            </button>
                        </div>

                        <div className="h-64 flex items-center justify-center border-t border-dashed border-zinc-200 bg-zinc-50/50 rounded-lg">
                            {metrics.totalCalls > 0 ? (
                                <p className="text-zinc-400 text-sm">Próximamente: Gráfico de actividad real</p>
                            ) : (
                                <div className="text-center">
                                    <BarChart3 className="mx-auto text-zinc-300 mb-2" size={32} />
                                    <p className="text-zinc-500 font-medium">Sin datos de actividad</p>
                                    <p className="text-zinc-400 text-xs">Realiza tu primera llamada para ver métricas.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Objection Analysis */}
                    <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                        <h3 className="font-bold text-zinc-900 mb-6">Top Objeciones</h3>
                        <div className="space-y-6">
                            {metrics.totalCalls > 0 ? (
                                <div className="text-center py-8 text-zinc-500 text-sm">
                                    Análisis de objeciones no disponible aún.
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Shield className="mx-auto text-zinc-300 mb-2" size={32} />
                                    <p className="text-zinc-500 font-medium">Sin objeciones detectadas</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

function KpiCard({ title, value, change, trend, icon: Icon, color, inverseTrend }: any) {
    const isPositive = trend === 'up';
    const isNegative = trend === 'down';

    // Detailed logic omitted for simplicity, keeping standard green=up

    const colorClasses: any = {
        blue: 'bg-blue-50 text-blue-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-600',
        purple: 'bg-purple-50 text-purple-600',
    }

    return (
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                    <Icon size={20} />
                </div>
                {change && trend !== 'neutral' && (
                    <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                        {isPositive ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                        {change}
                    </div>
                )}
            </div>
            <div>
                <h3 className="text-zinc-500 text-sm font-medium">{title}</h3>
                <p className="text-2xl font-bold text-zinc-900 mt-1">{value}</p>
            </div>
        </div>
    )
}

function ObjectionBar({ label, percentage, color }: any) {
    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-zinc-700">{label}</span>
                <span className="text-zinc-500">{percentage}%</span>
            </div>
            <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    )
}
