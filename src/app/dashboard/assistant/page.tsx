'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
    Mic,
    MicOff,
    Square,
    Play,
    Send,
    Settings,
    ThumbsUp,
    ThumbsDown,
    User,
    Bot,
    Sparkles,
    AlertCircle,
    Clock,
    ChevronLeft,
    MoreVertical,
    Phone,
    Video
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { AudioCapture } from '@/lib/audio-capture'
import StartCallModal from '@/components/dashboard/StartCallModal'

// Mock types
type Message = {
    id: string
    role: 'user' | 'assistant' | 'lead' | 'sdr' | 'system'
    content: string
    timestamp: Date
}

type Suggestion = {
    id: string
    content: string
    confidence: number
    citations?: { source: string; page?: number }[]
    context_used?: { content: string; metadata: any }[]
}

/**
 * Página del Asistente en Vivo.
 * Proporciona una interfaz de co-piloto para SDRs durante llamadas de ventas.
 * Incluye transcripción en tiempo real, sugerencias de IA basadas en RAG y gestión de feedback.
 */
export default function LiveAssistantPage() {
    const [isLive, setIsLive] = useState(false)
    const [transcript, setTranscript] = useState<Message[]>([])
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [inputText, setInputText] = useState('')
    const [orgId, setOrgId] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)
    const [audioSource, setAudioSource] = useState<'microphone' | 'system' | 'both'>('both')
    const [isCapturing, setIsCapturing] = useState(false)
    const [interimTranscript, setInterimTranscript] = useState('')
    const [showStartModal, setShowStartModal] = useState(false)
    const [selectedDeal, setSelectedDeal] = useState<{ id: string, title: string | null, company: string | null, contact_name?: string | null } | null>(null)

    const transcriptEndRef = useRef<HTMLDivElement>(null)
    const audioCapture = useRef<AudioCapture | null>(null)
    const supabase = createClient()
    const router = useRouter()

    // Load User & Org
    useEffect(() => {
        const loadUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                // Fetch Org ID from user profile (consistent with rest of app)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('organization_id')
                    .eq('id', user.id)
                    .single()

                if (profile?.organization_id) {
                    setOrgId(profile.organization_id)
                }
            }
        }
        loadUser()
    }, [])

    // Auto-scroll transcript
    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [transcript])

    const [showEndModal, setShowEndModal] = useState(false)
    const [currentInteractionId, setCurrentInteractionId] = useState<string | null>(null)

    /**
     * Inicia una nueva sesión de asistencia.
     * Configura el estado inicial, solicita permisos de audio e inicia la captura y transcripción.
     */
    const handleStartSession = async (config: { source: 'microphone' | 'system' | 'both', dealId?: string }) => {
        setAudioSource(config.source)
        setShowStartModal(false)

        // Fetch deal info if selected
        if (config.dealId) {
            const { data } = await supabase.from('deals').select('id, title, company, contact_name').eq('id', config.dealId).single()
            if (data) setSelectedDeal(data)
        } else {
            setSelectedDeal(null)
        }

        setIsLive(true)
        setTranscript([{
            id: 'init',
            role: 'system',
            content: 'Sesión iniciada. Iniciando captura de audio...',
            timestamp: new Date()
        }] as any)

        // Initialize audio capture
        try {
            audioCapture.current = new AudioCapture(
                (text, isFinal, source) => {
                    handleTranscriptUpdate(text, isFinal, source)
                },
                process.env.NEXT_PUBLIC_DEEPGRAM_KEY // Pass key if available
            )

            await audioCapture.current.startCapture(config.source)
            setIsCapturing(true)

            setTranscript(prev => [...prev, {
                id: 'audio-ready',
                role: 'system',
                content: `✓ Audio capturado desde: ${config.source === 'microphone' ? 'Micrófono' : 'Sistema'}`,
                timestamp: new Date()
            }] as any)
        } catch (error: any) {
            console.error('Error starting audio:', error)
            setTranscript(prev => [...prev, {
                id: 'audio-error',
                role: 'system',
                content: `⚠️ Error al capturar audio: ${error.message}. Usa el simulador manual.`,
                timestamp: new Date()
            }] as any)
            // Even if audio fails, we stay live for manual simulation
            setIsCapturing(false)
        }
    }

    /**
     * Procesa las actualizaciones de transcripción en tiempo real.
     * Si la transcripción es final, la añade al historial y solicita una sugerencia de IA.
     * 
     * @param text - El texto transcrito.
     * @param isFinal - Indica si el fragmento es definitivo o parcial.
     * @param source - La fuente del audio ('sdr' o 'client').
     */
    const handleTranscriptUpdate = async (text: string, isFinal: boolean, source: 'sdr' | 'client' = 'client') => {
        if (!isFinal) {
            setInterimTranscript(text)
            return
        }

        // Final transcript - add to messages
        setInterimTranscript('')
        const newMessage: Message = {
            id: Date.now().toString(),
            role: source === 'sdr' ? 'sdr' : 'lead', // SDR a la derecha, Lead a la izquierda
            content: text,
            timestamp: new Date()
        }

        setTranscript(prev => [...prev, newMessage])

        // Get AI suggestion only if it's from the client
        if (source === 'client') {
            await fetchAISuggestion(text)
        }
    }

    /**
     * Detiene la sesión actual, guarda la interacción en la base de datos
     * y sube la grabación de audio si está disponible.
     * Muestra el modal de feedback al finalizar.
     */
    const handleStopSession = async () => {
        setIsLive(false)

        // Stop audio capture and get recording
        let audioBlob: Blob | null = null
        let durationSeconds = 0

        if (audioCapture.current) {
            const result = await audioCapture.current.stopCapture()
            audioBlob = result.audioBlob
            durationSeconds = result.durationSeconds
            audioCapture.current = null
            setIsCapturing(false)
        }

        // Save to Supabase
        if (transcript.length > 1) { // Don't save empty sessions
            const fullText = transcript
                .filter(m => m.role !== 'system')
                .map(m => `${m.role === 'lead' ? 'Lead' : 'SDR'}: ${m.content}`)
                .join('\n')

            try {
                let audioUrl: string | null = null

                // Upload audio if available
                if (audioBlob) {
                    const fileName = `call_${Date.now()}.webm`
                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('call-recordings')
                        .upload(fileName, audioBlob, {
                            contentType: 'audio/webm',
                            upsert: false
                        })

                    if (!uploadError && uploadData) {
                        const { data: { publicUrl } } = supabase.storage
                            .from('call-recordings')
                            .getPublicUrl(fileName)

                        audioUrl = publicUrl
                    }
                }

                const { data, error } = await supabase.from('interactions').insert({
                    organization_id: orgId,
                    deal_id: selectedDeal?.id,
                    transcript_full: fullText,
                    status: 'NEUTRAL', // Uppercase for consistency with getStatusBadge in CallsPage
                    audio_url: audioUrl,
                    duration_seconds: durationSeconds
                }).select().single()

                if (data) setCurrentInteractionId(data.id)
            } catch (e) {
                console.error("Error saving interaction", e)
            }
        }
        setShowEndModal(true)
    }

    /**
     * Registra el feedback del usuario (positivo/negativo) sobre la sesión finalizada.
     * Si es positivo, dispara el bucle de aprendizaje para mejorar la base de conocimientos.
     * 
     * @param rating - Calificación de la sesión ('positive' o 'negative').
     */
    const handleFeedback = async (rating: 'positive' | 'negative') => {
        if (!currentInteractionId) {
            console.warn("No interaction ID found for feedback")
            setShowEndModal(false)
            return
        }

        setIsLoading(true)
        try {
            // Update status
            const { error: updateError } = await supabase.from('interactions').update({
                status: rating === 'positive' ? 'SUCCESS' : 'FAILURE'
            }).eq('id', currentInteractionId)

            if (updateError) throw updateError

            // Trigger Learning Loop if positive
            if (rating === 'positive') {
                try {
                    await fetch('/api/feedback', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ interaction_id: currentInteractionId })
                    })
                } catch (e) {
                    console.error("Learning loop error", e)
                }
            }
        } catch (error) {
            console.error("Error submitting feedback:", error)
        } finally {
            setShowEndModal(false)
            setIsLoading(false)
            setTranscript([]) // Reset
            setSuggestions([])
            setCurrentInteractionId(null)
        }
    }

    const handleUseSuggestion = (content: string) => {
        setTranscript(prev => [...prev, {
            id: Date.now().toString(),
            role: 'sdr',
            content: content,
            timestamp: new Date()
        } as Message])
    }

    /**
     * Realiza una petición al agente de contexto (RAG) para obtener una sugerencia
     * basada en el estado actual de la conversación.
     * 
     * @param transcriptText - El texto de la interacción actual para buscar contexto.
     */
    const fetchAISuggestion = async (transcriptText: string) => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/context', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transcript: transcriptText,
                    organization_id: orgId
                })
            })

            const data = await response.json()

            if (data.suggestion) {
                setSuggestions(prev => [{
                    id: Date.now().toString(),
                    content: data.suggestion,
                    confidence: 0.9,
                    context_used: data.context_used
                }, ...prev])
            }
        } catch (error) {
            console.error("Error fetching context:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSimulatedInput = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inputText.trim()) return

        // 1. Add "Lead" message to transcript (Simulating incoming audio)
        const newMessage: Message = {
            id: Date.now().toString(),
            role: 'lead',
            content: inputText,
            timestamp: new Date()
        }

        setTranscript(prev => [...prev, newMessage])
        const textToProcess = inputText
        setInputText('')

        // 2. Get AI suggestion
        await fetchAISuggestion(textToProcess)
    }

    return (
        <div className="flex h-[calc(100vh-theme(spacing.20))] bg-zinc-50 font-sans overflow-hidden">

            {/* Main Conversation Area (Left/Center) */}
            <div className="flex-1 flex flex-col min-w-0 bg-white border-r border-zinc-200">
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="p-2 hover:bg-zinc-100 rounded-full text-zinc-500">
                            <ChevronLeft size={20} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="font-bold text-lg text-zinc-900">
                                    {selectedDeal ? selectedDeal.title : 'Sesión sin Vincular'}
                                </h1>
                                {isLive && (
                                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-medium animate-pulse">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                                        LIVE
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-zinc-500 flex items-center gap-1">
                                <User size={12} /> {selectedDeal ? selectedDeal.company : 'Interacción General'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {!isLive ? (
                            <>
                                <button
                                    onClick={() => setShowStartModal(true)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-200 active:scale-95"
                                >
                                    <Phone size={16} /> Iniciar Llamada
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                {isCapturing && (
                                    <span className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                        Escuchando...
                                    </span>
                                )}
                                <span className="font-mono text-zinc-600 bg-zinc-100 px-2 py-1 rounded text-sm">00:14:23</span>
                                <button
                                    onClick={handleStopSession}
                                    className="bg-white border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                                >
                                    Finalizar Llamada
                                </button>
                            </div>
                        )}
                        <button className="p-2 text-zinc-400 hover:bg-zinc-100 rounded-lg">
                            <MoreVertical size={20} />
                        </button>
                    </div>
                </div>

                {/* Transcript */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {transcript.length === 0 && !isLive && (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                            <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                                <MicOff size={32} className="opacity-50" />
                            </div>
                            <p className="font-medium">Ready to start session</p>
                            <p className="text-sm">Click "Start Call" to begin analyzing</p>
                        </div>
                    )}

                    {transcript.map((msg) => (
                        <div key={msg.id} className={`flex gap-4 ${msg.role === 'sdr' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${msg.role === 'lead' ? 'bg-white border-zinc-200 text-zinc-600' :
                                msg.role === 'system' ? 'bg-transparent border-transparent' :
                                    'bg-indigo-50 border-indigo-100 text-indigo-600'
                                }`}>
                                {msg.role === 'lead' ? <span className="text-xs font-bold text-zinc-400">L</span> :
                                    msg.role === 'system' ? null :
                                        <span className="text-xs font-bold">ME</span>}
                            </div>

                            <div className={`max-w-[80%] space-y-1 ${msg.role === 'system' ? 'w-full text-center' : ''}`}>
                                {msg.role !== 'system' && (
                                    <p className={`text-xs font-medium ${msg.role === 'sdr' ? 'text-right' : ''} text-zinc-500`}>
                                        {msg.role === 'lead' ? (selectedDeal?.contact_name || selectedDeal?.title || 'Cliente') : 'Tú (SDR)'} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                )}

                                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'lead' ? 'bg-white border border-zinc-200 text-zinc-800 rounded-tl-none' :
                                    msg.role === 'system' ? 'text-zinc-400 text-xs italic bg-transparent shadow-none' :
                                        'bg-indigo-600 text-white rounded-tr-none'
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Interim Transcript (Real-time preview) */}
                    {interimTranscript && (
                        <div className="flex gap-4 opacity-60">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border bg-white border-zinc-200 text-zinc-600">
                                <span className="text-xs font-bold">...</span>
                            </div>
                            <div className="max-w-[80%] space-y-1">
                                <p className="text-xs font-medium text-zinc-500">
                                    Procesando audio...
                                </p>
                                <div className="p-4 rounded-2xl text-sm leading-relaxed shadow-sm bg-white border border-zinc-200 text-zinc-800 rounded-tl-none italic">
                                    {interimTranscript}
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={transcriptEndRef} />
                </div>

                {/* Sim Input */}
                {isLive && (
                    <div className="p-4 bg-white border-t border-zinc-200">
                        <form onSubmit={handleSimulatedInput} className="flex gap-2">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner"
                                placeholder="Type what the lead is saying (Simulator)..."
                            />
                            <button
                                type="submit"
                                disabled={!inputText.trim() || isLoading}
                                className="bg-zinc-900 text-white px-4 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* AI Co-Pilot Sidebar (Right) */}
            <div className="hidden md:flex flex-col w-[350px] lg:w-[400px] bg-zinc-50/50">
                <div className="h-16 flex items-center px-6 border-b border-zinc-200 bg-white">
                    <Bot className="text-indigo-600 mr-2" size={20} />
                    <h2 className="font-bold text-zinc-900">Co-Pilot Intelligence</h2>
                    <span className="ml-auto flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                        <Sparkles size={12} /> Live
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Tips / Welcome */}
                    {suggestions.length === 0 && !isLoading && (
                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                            <h3 className="font-semibold text-indigo-900 text-sm mb-2">Pre-Call Brief</h3>
                            <ul className="text-xs text-indigo-700 space-y-2 list-disc pl-4">
                                <li>Goal: Qualify budget and timeline.</li>
                                <li>Mention: Integration capability with their current stack.</li>
                                <li>Warning: Competitor 'Credax' likely in play.</li>
                            </ul>
                        </div>
                    )}

                    {isLoading && (
                        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm animate-pulse">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 bg-zinc-100 rounded-full" />
                                <div className="h-4 bg-zinc-100 rounded w-1/2" />
                            </div>
                            <div className="space-y-2">
                                <div className="h-2 bg-zinc-100 rounded w-full" />
                                <div className="h-2 bg-zinc-100 rounded w-4/5" />
                            </div>
                        </div>
                    )}

                    {suggestions.map((suggestion) => (
                        <div key={suggestion.id} className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden animate-in slide-in-from-right-2 duration-500">
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Suggestion</span>
                                    <span className="text-[10px] text-zinc-400 font-mono">{(suggestion.confidence * 100).toFixed(0)}% CONFIDENCE</span>
                                </div>
                                <p className="text-sm text-zinc-800 leading-relaxed font-medium">
                                    {suggestion.content}
                                </p>
                            </div>

                            {/* Context / Footer */}
                            <div className="bg-zinc-50 px-4 py-3 border-t border-zinc-100 flex items-center justify-between">
                                <span className="text-xs text-zinc-500 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Knowledge Base
                                </span>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleUseSuggestion(suggestion.content)}
                                        className="p-1.5 hover:bg-zinc-200 rounded text-zinc-400 hover:text-indigo-600 transition-colors mr-1"
                                        title="Use this response"
                                    >
                                        <Play size={14} />
                                    </button>
                                    <button className="p-1.5 hover:bg-zinc-200 rounded text-zinc-400 hover:text-emerald-600 transition-colors">
                                        <ThumbsUp size={14} />
                                    </button>
                                    <button className="p-1.5 hover:bg-zinc-200 rounded text-zinc-400 hover:text-red-500 transition-colors">
                                        <ThumbsDown size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* End Session Feedback Modal */}
            {showEndModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 w-[400px] shadow-2xl animate-in zoom-in-95">
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Sparkles size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-zinc-900">Sesión Finalizada</h2>
                            <p className="text-sm text-zinc-500">¿Cómo fue el desempeño de la IA? Tu feedback ayuda al sistema a aprender.</p>
                        </div>

                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={() => handleFeedback('positive')}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 p-4 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-emerald-700 rounded-xl font-medium transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ThumbsUp className="group-hover:scale-110 transition-transform" />
                                ¡Excelente! (Aprender para el futuro)
                            </button>
                            <button
                                type="button"
                                onClick={() => handleFeedback('negative')}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 p-4 bg-zinc-50 border border-zinc-100 hover:bg-zinc-100 text-zinc-600 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ThumbsDown />
                                Necesita Mejorar
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setShowEndModal(false)
                                setTranscript([])
                                setSuggestions([])
                                setCurrentInteractionId(null)
                            }}
                            disabled={isLoading}
                            className="w-full mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Omitir Feedback
                        </button>
                    </div>
                </div>
            )}

            {/* Start Session Modal */}
            <StartCallModal
                isOpen={showStartModal}
                onClose={() => setShowStartModal(false)}
                orgId={orgId}
                onStart={handleStartSession}
            />
        </div>
    )
}
