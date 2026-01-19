'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Square, Play, Send, Settings, ThumbsUp, ThumbsDown, User, Bot, Sparkles, AlertCircle } from 'lucide-react'

// Mock types
type Message = {
    id: string
    role: 'user' | 'assistant' | 'lead' | 'sdr'
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

export default function LiveAssistant() {
    const [isLive, setIsLive] = useState(false)
    const [transcript, setTranscript] = useState<Message[]>([])
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [inputText, setInputText] = useState('')
    const [orgId, setOrgId] = useState('00000000-0000-0000-0000-000000000000') // Default/Placeholder
    const [isLoading, setIsLoading] = useState(false)

    const transcriptEndRef = useRef<HTMLDivElement>(null)

    // Auto-scroll transcript
    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [transcript])

    const handleStartSession = () => {
        setIsLive(true)
        setTranscript([{
            id: 'init',
            role: 'system',
            content: 'Sesión iniciada. Esperando audio...',
            timestamp: new Date()
        }] as any)
    }

    const handleStopSession = () => {
        setIsLive(false)
        // Here we would trigger the Feedback loop/End of call summary
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
        setInputText('')
        setIsLoading(true)

        // 2. Call API for Context/Help
        try {
            const response = await fetch('/api/context', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transcript: newMessage.content,
                    organization_id: orgId
                })
            })

            const data = await response.json()

            if (data.suggestion) {
                setSuggestions(prev => [{
                    id: Date.now().toString(),
                    content: data.suggestion,
                    confidence: 0.9, // API doesn't return this yet, mocking
                    context_used: data.context_used
                }, ...prev])
            }
        } catch (error) {
            console.error("Error fetching context:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden">

            {/* LEFT COLUMN: TRANSCRIPT & CONTROLS */}
            <div className="flex flex-col w-2/3 border-r border-zinc-800">

                {/* Header */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
                        <h1 className="font-semibold text-lg">Asistente en Vivo</h1>
                        {isLive && <span className="text-xs font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded">00:14:23</span>}
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={orgId}
                            onChange={(e) => setOrgId(e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 text-xs px-2 py-1 rounded w-32 text-zinc-500 focus:text-zinc-300 outline-none"
                            placeholder="Org ID"
                        />
                        <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400">
                            <Settings size={18} />
                        </button>
                    </div>
                </div>

                {/* Transcript Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
                    {transcript.length === 0 && !isLive && (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-4">
                            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center">
                                <MicOff size={32} />
                            </div>
                            <p>El asistente está desconectado.</p>
                            <button
                                onClick={handleStartSession}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-full font-medium transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                            >
                                <Play size={18} /> Iniciar Sesión
                            </button>
                        </div>
                    )}

                    {transcript.map((msg) => (
                        <div key={msg.id} className={`flex gap-4 ${msg.role === 'sdr' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'lead' ? 'bg-blue-500/10 text-blue-400' :
                                    msg.role === 'system' ? 'bg-zinc-800 text-zinc-400' :
                                        'bg-purple-500/10 text-purple-400'
                                }`}>
                                {msg.role === 'lead' ? <User size={18} /> : msg.role === 'system' ? <AlertCircle size={18} /> : <User size={18} />}
                            </div>

                            <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${msg.role === 'lead' ? 'bg-zinc-900 border border-zinc-800 text-zinc-200' :
                                    msg.role === 'system' ? 'text-xs italic text-zinc-500 w-full text-center' :
                                        'bg-purple-600/20 border border-purple-500/30 text-purple-100'
                                }`}>
                                {msg.role !== 'system' && (
                                    <div className="text-xs font-medium opacity-50 mb-1 mb-2">
                                        {msg.role === 'lead' ? 'Leads / Prospecto' : 'Tú / SDR'}
                                    </div>
                                )}
                                <p className="leading-relaxed">{msg.content}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={transcriptEndRef} />
                </div>

                {/* Input Simulation Area */}
                {isLive && (
                    <div className="h-24 bg-zinc-900 border-t border-zinc-800 p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center animate-pulse">
                            <Mic size={20} />
                        </div>
                        <form onSubmit={handleSimulatedInput} className="flex-1 flex gap-2">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-sm focus:outline-none focus:border-zinc-700 transition-colors"
                                placeholder="Simular transcripción de voz (escribe como si fuera el Lead)..."
                            />
                            <button
                                type="submit"
                                disabled={!inputText.trim() || isLoading}
                                className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-100 p-3 rounded-xl transition-colors"
                            >
                                <Send size={18} />
                            </button>
                        </form>
                        <button
                            onClick={handleStopSession}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-3 rounded-xl transition-colors border border-red-500/30"
                            title="Terminar Llamada"
                        >
                            <Square size={18} />
                        </button>
                    </div>
                )}
            </div>

            {/* RIGHT COLUMN: AI CO-PILOT */}
            <div className="w-1/3 bg-zinc-900 border-l border-zinc-800 flex flex-col">
                <div className="h-16 flex items-center px-6 border-b border-zinc-800 gap-2">
                    <Bot className="text-indigo-400" size={20} />
                    <h2 className="font-semibold text-zinc-100">Co-Piloto IA</h2>
                    <span className="ml-auto text-xs bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-full border border-indigo-500/20">
                        Brain Active
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {isLoading && (
                        <div className="animate-pulse flex gap-3 p-4 rounded-xl bg-zinc-800/50 border border-zinc-800">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-zinc-700 rounded w-3/4"></div>
                                <div className="h-3 bg-zinc-700 rounded w-1/2"></div>
                            </div>
                        </div>
                    )}

                    {suggestions.map((suggestion) => (
                        <div key={suggestion.id} className="group relative bg-zinc-950 border border-zinc-800 hover:border-indigo-500/50 transition-all rounded-xl p-5 shadow-sm hover:shadow-md hover:shadow-indigo-500/5">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2 text-indigo-400 text-sm font-medium">
                                    <Sparkles size={14} />
                                    <span>Sugerencia</span>
                                </div>
                                <span className="text-xs text-zinc-600 font-mono">
                                    {(suggestion.confidence * 100).toFixed(0)}% Match
                                </span>
                            </div>

                            <p className="text-zinc-300 text-sm leading-relaxed mb-4">
                                {suggestion.content}
                            </p>

                            {suggestion.context_used && suggestion.context_used.length > 0 && (
                                <div className="mb-4 p-3 bg-zinc-900 rounded border border-zinc-800/50">
                                    <p className="text-xs text-zinc-500 font-medium mb-1">Fuentes detectadas:</p>
                                    {suggestion.context_used.slice(0, 2).map((ctx, idx) => (
                                        <div key={idx} className="text-[10px] text-zinc-600 truncate flex items-center gap-1">
                                            <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                                            Doc ID: {(ctx.metadata as any)?.source || 'Unknown'}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-2 pt-3 border-t border-zinc-900">
                                <button className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 rounded transition-colors">
                                    <ThumbsUp size={14} /> Útil
                                </button>
                                <button className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/5 rounded transition-colors">
                                    <ThumbsDown size={14} /> Rechazar
                                </button>
                            </div>
                        </div>
                    ))}

                    {suggestions.length === 0 && !isLoading && (
                        <div className="text-center p-10 opacity-30">
                            <p className="text-sm">Esperando contexto...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
