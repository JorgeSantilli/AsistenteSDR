'use client'

import React, { useState, useEffect } from 'react'
import {
    Phone,
    Briefcase,
    User,
    Link2Off,
    Search,
    X,
    ChevronRight,
    Loader2,
    Mic,
    Monitor
} from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'

interface Deal {
    id: string
    title: string | null
    company: string | null
}

interface StartCallModalProps {
    isOpen: boolean
    onClose: () => void
    orgId: string
    onStart: (config: {
        source: 'microphone' | 'system' | 'both',
        dealId?: string,
        contactName?: string
    }) => void
}

export default function StartCallModal({ isOpen, onClose, orgId, onStart }: StartCallModalProps) {
    const [step, setStep] = useState<'type' | 'select_deal'>('type')
    const [deals, setDeals] = useState<Deal[]>([])
    const [loading, setLoading] = useState(false)
    const [audioSource, setAudioSource] = useState<'microphone' | 'system' | 'both'>('both')
    const [search, setSearch] = useState('')

    const supabase = createClient()

    useEffect(() => {
        if (step === 'select_deal' && orgId) {
            loadDeals()
        }
    }, [step, orgId])

    async function loadDeals() {
        setLoading(true)
        const { data, error } = await supabase
            .from('deals')
            .select('id, title, company, contact_name, contact_phone')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })
            .limit(20)

        if (data) setDeals(data as any)
        setLoading(false)
    }

    if (!isOpen) return null

    const filteredDeals = (deals as any[]).filter(d =>
        (d.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.company || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.contact_name || '').toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900">Configurar Nueva Llamada</h2>
                        <p className="text-sm text-zinc-500">Selecciona el contexto para tu sesión de asistencia.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full text-zinc-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {/* Audio Source Selection (Always visible at top) */}
                    <div className="mb-8">
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Fuente de Audio</label>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => setAudioSource('microphone')}
                                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${audioSource === 'microphone' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-zinc-100 hover:border-zinc-200 text-zinc-500'}`}
                            >
                                <Mic size={20} />
                                <span className="text-[10px] font-bold">SOLO MIC</span>
                            </button>
                            <button
                                onClick={() => setAudioSource('system')}
                                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${audioSource === 'system' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-zinc-100 hover:border-zinc-200 text-zinc-500'}`}
                            >
                                <Monitor size={20} />
                                <span className="text-[10px] font-bold">SOLO SISTEMA</span>
                            </button>
                            <button
                                onClick={() => setAudioSource('both')}
                                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${audioSource === 'both' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-zinc-100 hover:border-zinc-200 text-zinc-500'}`}
                            >
                                <div className="flex gap-1">
                                    <Mic size={16} />
                                    <Monitor size={16} />
                                </div>
                                <span className="text-[10px] font-bold">AMBOS</span>
                            </button>
                        </div>
                    </div>

                    {step === 'type' ? (
                        <div className="space-y-3">
                            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Vincular a:</label>

                            <button
                                onClick={() => setStep('select_deal')}
                                className="w-full flex items-center justify-between p-4 bg-white border border-zinc-200 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Briefcase size={22} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-zinc-900 leading-tight">Negocio / Deal</p>
                                        <p className="text-xs text-zinc-500">Asocia la llamada a una oportunidad del pipeline.</p>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-zinc-300" />
                            </button>

                            <button
                                onClick={() => alert('Próximamente: Vinculación directa con contactos')}
                                className="w-full flex items-center justify-between p-4 bg-white border border-zinc-200 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group opacity-60"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                                        <User size={22} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-zinc-900 leading-tight">Contacto Individual</p>
                                        <p className="text-xs text-zinc-500">Busca directamente por nombre de persona.</p>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-zinc-300" />
                            </button>

                            <div className="pt-4 mt-4 border-t border-zinc-50">
                                <button
                                    onClick={() => onStart({ source: audioSource })}
                                    className="w-full flex items-center justify-center gap-2 p-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg"
                                >
                                    <Link2Off size={18} />
                                    Llamada sin Vinculación
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <button onClick={() => setStep('type')} className="text-xs font-bold text-indigo-600 hover:underline flex items-center">
                                    <ChevronRight size={14} className="rotate-180" /> Volver
                                </button>
                                <span className="text-xs text-zinc-300">|</span>
                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest leading-none">Seleccionar Negocio</span>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar negocio o empresa..."
                                    className="w-full pl-10 pr-4 py-3 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                    autoFocus
                                />
                            </div>

                            <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                                {loading ? (
                                    <div className="flex flex-col items-center py-10 text-zinc-400">
                                        <Loader2 size={24} className="animate-spin mb-2" />
                                        <p className="text-xs">Cargando negocios...</p>
                                    </div>
                                ) : filteredDeals.length === 0 ? (
                                    <div className="py-10 text-center text-zinc-400">
                                        <p className="text-sm">No se encontraron negocios.</p>
                                    </div>
                                ) : (
                                    filteredDeals.map(deal => (
                                        <button
                                            key={deal.id}
                                            onClick={() => onStart({ source: audioSource, dealId: deal.id })}
                                            className="w-full text-left p-3 rounded-xl border border-zinc-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all flex items-center justify-between"
                                        >
                                            <div>
                                                <p className="text-sm font-bold text-zinc-800">{deal.title || 'Sin Título'}</p>
                                                <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">{deal.company || 'Sin Empresa'}</p>
                                            </div>
                                            {deal.contact_name && (
                                                <div className="text-right">
                                                    <p className="text-xs font-medium text-indigo-600">{deal.contact_name}</p>
                                                    <p className="text-[10px] text-zinc-400">{deal.contact_phone || ''}</p>
                                                </div>
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Message */}
                <div className="px-6 py-4 bg-indigo-600 text-white text-[10px] font-bold text-center uppercase tracking-[0.2em]">
                    Real-time AI Feedback Enabled
                </div>
            </div>
        </div>
    )
}
