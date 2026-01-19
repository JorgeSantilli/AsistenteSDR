'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
    Search,
    Filter,
    Calendar,
    Clock,
    Phone,
    FileText,
    Download,
    Play,
    Pause,
    Volume2,
    ChevronDown,
    ChevronRight,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Save,
    Trash2,
    BarChart2,
    PieChart,
    Tag,
    TrendingUp,
    ThumbsUp,
    ThumbsDown,
    Zap
} from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
import { exportTranscriptAsTXT, exportTranscriptAsPDF, downloadAudio } from '@/lib/export-utils'

type Interaction = {
    id: string
    organization_id: string
    transcript_full: string | null
    status: 'SUCCESS' | 'FAILURE' | 'NEUTRAL' | null
    created_at: string
    audio_url: string | null
    notes: string | null
    duration_seconds: number | null
    interaction_suggestions?: {
        id: string
        objection_text: string
        suggestion_text: string
        is_useful: boolean | null
    }[]
}

export default function CallsPage() {
    const [interactions, setInteractions] = useState<Interaction[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [expandedCall, setExpandedCall] = useState<string | null>(null)
    const [playingAudio, setPlayingAudio] = useState<string | null>(null)
    const [notes, setNotes] = useState<Record<string, string>>({})
    const [savingNotes, setSavingNotes] = useState<string | null>(null)
    const audioRefs = useRef<Record<string, HTMLAudioElement>>({})
    const supabase = createClient()

    useEffect(() => {
        loadInteractions()
    }, [])

    const loadInteractions = async () => {
        setIsLoading(true)
        try {
            // Fetch interactions with deal info
            const { data, error } = await supabase
                .from('interactions')
                .select(`
                    *,
                    deals (
                        title,
                        company,
                        contact_name
                    ),
                    interaction_suggestions (
                        id,
                        objection_text,
                        suggestion_text,
                        is_useful
                    )
                `)
                .order('created_at', { ascending: false })

            if (error) throw error

            const typedData = (data || []) as any
            setInteractions(typedData)

            // Initialize notes state
            const notesMap: Record<string, string> = {}
            typedData.forEach((interaction: Interaction) => {
                notesMap[interaction.id] = interaction.notes || ''
            })
            setNotes(notesMap)
        } catch (error) {
            console.error('Error loading interactions:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const saveNotes = async (interactionId: string) => {
        setSavingNotes(interactionId)
        try {
            await fetch(`/api/interactions/${interactionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes: notes[interactionId] })
            })
        } catch (error) {
            console.error('Error saving notes:', error)
        } finally {
            setSavingNotes(null)
        }
    }

    const handleDelete = async (interactionId: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta llamada? Esta acción no se puede deshacer.')) return

        try {
            const { error } = await supabase
                .from('interactions')
                .delete()
                .eq('id', interactionId)

            if (error) throw error

            setInteractions(prev => prev.filter(i => i.id !== interactionId))
        } catch (error) {
            console.error('Error deleting interaction:', error)
            alert('Error al eliminar la llamada')
        }
    }

    const rateSuggestion = async (suggestionId: string, isUseful: boolean) => {
        try {
            const { error } = await supabase
                .from('interaction_suggestions' as any)
                .update({ is_useful: isUseful } as any)
                .eq('id', suggestionId)

            if (error) throw error

            // Update local state
            setInteractions(prev => (prev as any[]).map(interaction => ({
                ...interaction,
                interaction_suggestions: interaction.interaction_suggestions?.map((s: any) =>
                    s.id === suggestionId ? { ...s, is_useful: isUseful } : s
                )
            })))
        } catch (error) {
            console.error('Error rating suggestion:', error)
        }
    }

    const getMetrics = (transcript: string | null) => {
        if (!transcript) return { sdrWords: 0, leadWords: 0, topWords: [], ratio: 50 }

        const lines = transcript.split('\n')
        let sdrWords = 0
        let leadWords = 0
        const wordFreq: Record<string, number> = {}
        const stopWords = new Set([
            'el', 'la', 'los', 'las', 'un', 'una', 'y', 'o', 'que', 'en', 'es', 'de', 'del', 'no', 'si', 'por', 'para', 'con',
            'sdr:', 'lead:', 'hola', 'este', 'esta', 'estos', 'estas', 'todo', 'toda', 'pero', 'mas', 'muy', 'como', 'cuando',
            'donde', 'quien', 'porque', 'para', 'bueno', 'bien', 'claro', 'entonces', 'tambien', 'desde'
        ])

        lines.forEach(line => {
            const isSDR = line.startsWith('SDR:')
            const isLead = line.startsWith('Lead:')
            const content = line.replace(/^(SDR:|Lead:)\s*/, '')
            const words = content.toLowerCase().match(/\b\w+\b/g) || []

            if (isSDR) sdrWords += words.length
            if (isLead) leadWords += words.length

            words.forEach(w => {
                if (w.length > 3 && !stopWords.has(w)) {
                    wordFreq[w] = (wordFreq[w] || 0) + 1
                }
            })
        })

        const total = sdrWords + leadWords
        const ratio = total > 0 ? (sdrWords / total) * 100 : 50
        const topWords = Object.entries(wordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word]) => word)

        return { sdrWords, leadWords, topWords, ratio }
    }

    const toggleAudio = (interactionId: string, audioUrl: string) => {
        const audio = audioRefs.current[interactionId]

        if (!audio) {
            const newAudio = new Audio(audioUrl)
            audioRefs.current[interactionId] = newAudio

            newAudio.onended = () => setPlayingAudio(null)
            newAudio.play()
            setPlayingAudio(interactionId)
        } else {
            if (playingAudio === interactionId) {
                audio.pause()
                setPlayingAudio(null)
            } else {
                audio.play()
                setPlayingAudio(interactionId)
            }
        }
    }

    const filteredInteractions = interactions.filter(interaction => {
        const matchesSearch = interaction.transcript_full
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())

        const matchesStatus =
            filterStatus === 'all' ||
            interaction.status?.toLowerCase() === filterStatus.toLowerCase()

        return matchesSearch && matchesStatus
    })

    const getStatusBadge = (status: string | null) => {
        const badges: Record<string, { color: string; icon: any; label: string }> = {
            'SUCCESS': {
                color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                icon: CheckCircle2,
                label: 'Exitosa'
            },
            'FAILURE': {
                color: 'bg-red-100 text-red-700 border-red-200',
                icon: XCircle,
                label: 'Fallida'
            },
            'NEUTRAL': {
                color: 'bg-zinc-100 text-zinc-600 border-zinc-200',
                icon: AlertCircle,
                label: 'Neutral'
            }
        }

        const badge = badges[status || 'NEUTRAL'] || badges['NEUTRAL']
        const Icon = badge.icon

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
                <Icon size={14} />
                {badge.label}
            </span>
        )
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return 'N/A'
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const toggleExpand = (id: string) => {
        setExpandedCall(expandedCall === id ? null : id)
    }

    return (
        <div className="flex flex-col h-full bg-zinc-50">
            {/* Header */}
            <div className="bg-white border-b border-zinc-200 px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900">Historial de Llamadas</h1>
                        <p className="text-sm text-zinc-500 mt-1">
                            {filteredInteractions.length} llamadas registradas
                        </p>
                    </div>
                    <button
                        onClick={loadInteractions}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                        <Download size={18} />
                        Actualizar
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
                            placeholder="Buscar en transcripciones..."
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                    </div>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="success">Exitosas</option>
                        <option value="failure">Fallidas</option>
                        <option value="neutral">Neutrales</option>
                    </select>
                </div>
            </div>

            {/* Calls List */}
            <div className="flex-1 overflow-auto p-6">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="flex items-center gap-2 text-zinc-500">
                            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            Cargando llamadas...
                        </div>
                    </div>
                ) : filteredInteractions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
                        <Phone size={48} className="mb-4 opacity-20" />
                        <p className="font-medium">No se encontraron llamadas</p>
                        <p className="text-sm">Intenta ajustar los filtros o realiza tu primera llamada</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredInteractions.map((interaction) => (
                            <div
                                key={interaction.id}
                                className="bg-white rounded-xl border border-zinc-200 overflow-hidden hover:shadow-md transition-shadow"
                            >
                                {/* Call Header */}
                                <div
                                    className="p-4 cursor-pointer hover:bg-zinc-50 transition-colors"
                                    onClick={() => toggleExpand(interaction.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                                                <Phone size={20} />
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="font-semibold text-zinc-900">
                                                        {(interaction as any).deals?.title || 'Sesión sin Vincular'}
                                                    </h3>
                                                    <p className="text-xs text-zinc-500">
                                                        {(interaction as any).deals?.company} {(interaction as any).deals?.contact_name ? `• ${(interaction as any).deals.contact_name}` : ''}
                                                    </p>
                                                    {getStatusBadge(interaction.status)}
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-zinc-500">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={14} />
                                                        {formatDate(interaction.created_at)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={14} />
                                                        {formatDuration(interaction.duration_seconds)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <FileText size={14} />
                                                        {interaction.transcript_full?.split(' ').length || 0} palabras
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {expandedCall === interaction.id ? (
                                                <ChevronDown className="text-zinc-400" size={20} />
                                            ) : (
                                                <ChevronRight className="text-zinc-400" size={20} />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {expandedCall === interaction.id && (
                                    <div className="border-t border-zinc-200 bg-zinc-50">
                                        <div className="p-6 space-y-6">
                                            {/* Audio Player */}
                                            {interaction.audio_url && (
                                                <div className="bg-white rounded-lg border border-zinc-200 p-4">
                                                    <div className="flex items-center gap-4">
                                                        <button
                                                            onClick={() => toggleAudio(interaction.id, interaction.audio_url!)}
                                                            className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center text-white transition-colors"
                                                        >
                                                            {playingAudio === interaction.id ? (
                                                                <Pause size={18} />
                                                            ) : (
                                                                <Play size={18} />
                                                            )}
                                                        </button>
                                                        <div className="flex-1">
                                                            <p className="text-sm text-zinc-600 mb-1">Grabación de la llamada</p>
                                                            <p className="text-xs text-zinc-400">
                                                                Duración: {formatDuration(interaction.duration_seconds)}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => interaction.audio_url && downloadAudio(interaction.audio_url, interaction.created_at)}
                                                            className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                                                        >
                                                            <Download size={18} className="text-zinc-600" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Transcript */}
                                            <div>
                                                <h4 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2">
                                                    <FileText size={18} />
                                                    Transcripción Completa
                                                </h4>
                                                <div className="bg-white rounded-lg border border-zinc-200 p-4 max-h-64 overflow-y-auto">
                                                    <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
                                                        {interaction.transcript_full || 'No hay transcripción disponible'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Metrics Panel */}
                                            {interaction.transcript_full && (
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div className="bg-white rounded-lg border border-zinc-200 p-4">
                                                        <h5 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                            <BarChart2 size={14} /> Participación
                                                        </h5>
                                                        {(() => {
                                                            const { sdrWords, leadWords, ratio } = getMetrics(interaction.transcript_full)
                                                            return (
                                                                <div className="space-y-4">
                                                                    <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden flex">
                                                                        <div className="bg-indigo-500 h-full" style={{ width: `${ratio}%` }} />
                                                                        <div className="bg-zinc-300 h-full" style={{ width: `${100 - ratio}%` }} />
                                                                    </div>
                                                                    <div className="flex justify-between items-end">
                                                                        <div>
                                                                            <p className="text-[10px] text-zinc-500 uppercase font-medium">SDR</p>
                                                                            <p className="text-lg font-bold text-indigo-600">{sdrWords}</p>
                                                                            <p className="text-[10px] text-zinc-400">palabras</p>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className="text-[10px] text-zinc-500 uppercase font-medium">Lead</p>
                                                                            <p className="text-lg font-bold text-zinc-500">{leadWords}</p>
                                                                            <p className="text-[10px] text-zinc-400">palabras</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })()}
                                                    </div>

                                                    <div className="bg-white rounded-lg border border-zinc-200 p-4">
                                                        <h5 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                            <TrendingUp size={14} /> Dominio
                                                        </h5>
                                                        {(() => {
                                                            const { ratio } = getMetrics(interaction.transcript_full)
                                                            return (
                                                                <div className="flex flex-col items-center justify-center py-2 text-center">
                                                                    <span className="text-2xl font-black text-zinc-800 mb-1">
                                                                        {ratio > 60 ? 'SDR Domina' : ratio < 40 ? 'Lead Domina' : 'Equilibrada'}
                                                                    </span>
                                                                    <p className="text-xs text-zinc-500 leading-tight">
                                                                        Basado en el volumen de palabras intercambiadas
                                                                    </p>
                                                                </div>
                                                            )
                                                        })()}
                                                    </div>

                                                    <div className="bg-white rounded-lg border border-zinc-200 p-4">
                                                        <h5 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                            <Tag size={14} /> Palabras Clave
                                                        </h5>
                                                        <div className="flex flex-wrap gap-2">
                                                            {getMetrics(interaction.transcript_full).topWords.map(word => (
                                                                <span key={word} className="px-2 py-1 bg-zinc-100 text-zinc-600 rounded text-xs font-medium border border-zinc-200">
                                                                    {word}
                                                                </span>
                                                            ))}
                                                            {getMetrics(interaction.transcript_full).topWords.length === 0 && (
                                                                <p className="text-xs text-zinc-400 italic">No hay suficientes datos</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Suggestions Analysis */}
                                            {interaction.interaction_suggestions && interaction.interaction_suggestions.length > 0 && (
                                                <div className="space-y-4">
                                                    <h4 className="font-semibold text-zinc-900 flex items-center gap-2">
                                                        <Zap size={18} className="text-amber-500" />
                                                        Análisis de Objeciones y Sugerencias
                                                    </h4>
                                                    <div className="grid grid-cols-1 gap-3">
                                                        {interaction.interaction_suggestions.map((s) => (
                                                            <div key={s.id} className="bg-white rounded-lg border border-zinc-200 p-4 flex flex-col gap-3">
                                                                <div className="flex justify-between items-start gap-4">
                                                                    <div className="flex-1">
                                                                        <p className="text-xs font-bold text-zinc-400 uppercase mb-1">Objeción detectada</p>
                                                                        <p className="text-sm text-zinc-700 italic">"{s.objection_text}"</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <button
                                                                            onClick={() => rateSuggestion(s.id, true)}
                                                                            className={`p-1.5 rounded-md transition-all ${s.is_useful === true ? 'bg-green-100 text-green-600' : 'hover:bg-zinc-100 text-zinc-400'}`}
                                                                            title="Útil"
                                                                        >
                                                                            <ThumbsUp size={16} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => rateSuggestion(s.id, false)}
                                                                            className={`p-1.5 rounded-md transition-all ${s.is_useful === false ? 'bg-red-100 text-red-600' : 'hover:bg-zinc-100 text-zinc-400'}`}
                                                                            title="No útil"
                                                                        >
                                                                            <ThumbsDown size={16} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <div className="bg-amber-50/50 border border-amber-100 rounded-md p-3">
                                                                    <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Sugerencia Co-Pilot</p>
                                                                    <p className="text-sm text-zinc-800">{s.suggestion_text}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Notes Section */}
                                            <div>
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="font-semibold text-zinc-900">Notas y Resumen</h4>
                                                    <button
                                                        onClick={() => saveNotes(interaction.id)}
                                                        disabled={savingNotes === interaction.id}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                                    >
                                                        <Save size={14} />
                                                        {savingNotes === interaction.id ? 'Guardando...' : 'Guardar Notas'}
                                                    </button>
                                                </div>
                                                <textarea
                                                    value={notes[interaction.id] || ''}
                                                    onChange={(e) => setNotes({ ...notes, [interaction.id]: e.target.value })}
                                                    placeholder="Agregar notas sobre esta llamada..."
                                                    className="w-full bg-white border border-zinc-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[100px]"
                                                />
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-3 pt-4 border-t border-zinc-200">
                                                <button
                                                    onClick={() => exportTranscriptAsTXT(
                                                        interaction.transcript_full || '',
                                                        interaction.created_at,
                                                        interaction.status || undefined
                                                    )}
                                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors text-sm font-medium"
                                                >
                                                    <Download size={16} />
                                                    Exportar TXT
                                                </button>
                                                <button
                                                    onClick={() => exportTranscriptAsPDF(
                                                        interaction.transcript_full || '',
                                                        interaction.created_at,
                                                        interaction.status || undefined,
                                                        notes[interaction.id]
                                                    )}
                                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors text-sm font-medium"
                                                >
                                                    <FileText size={16} />
                                                    Exportar PDF
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(interaction.id)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-red-100 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium ml-auto"
                                                >
                                                    <Trash2 size={16} />
                                                    Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
