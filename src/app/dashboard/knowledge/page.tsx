'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import { createClient } from '@/lib/supabase-browser'
import {
    FileText,
    Upload,
    Trash2,
    Search,
    Plus,
    Database,
    RefreshCw,
    Check,
    XCircle
} from 'lucide-react'

type KnowledgeItem = {
    id: string
    content: string
    metadata: any
    created_at: string
    embedding?: any
}

export default function KnowledgePage() {
    const [items, setItems] = useState<KnowledgeItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isUploading, setIsUploading] = useState(false)
    const [newItemContent, setNewItemContent] = useState('')
    const [newItemTags, setNewItemTags] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)

    const supabase = createClient()

    const fetchKnowledge = async () => {
        setIsLoading(true)
        const { data } = await supabase
            .from('knowledge_base')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50)

        // Cast to unknown first if needed or just accept that Supabase types might have nulls
        if (data) setItems(data as any as KnowledgeItem[])
        setIsLoading(false)
    }

    useEffect(() => {
        fetchKnowledge()
    }, [])

    const handleManualAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsUploading(true)

        // For this prototype, we'll hit the 'seed' logic or a new ingest logic
        // But since we want embeddings, we should probably use an API route that handles embeddings
        // We'll reuse the logic from the seed script essentially, but exposed as a single item ingest

        // TEMPORARY: using a direct insert assuming we have an API or trigger later.
        // actually, we need embeddings. Let's create a quick API for this.
        try {
            const response = await fetch('/api/ingest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newItemContent,
                    tags: newItemTags.split(',').map(t => t.trim()),
                    source: 'manual_upload'
                })
            })

            if (!response.ok) throw new Error('Failed to ingest')

            await fetchKnowledge()
            setShowAddModal(false)
            setNewItemContent('')
            setNewItemTags('')
            alert('Conocimiento agregado exitosamente')
        } catch (error) {
            alert('Error al agregar conocimiento')
            console.error(error)
        } finally {
            setIsUploading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este fragmento?')) return
        await supabase.from('knowledge_base').delete().eq('id', id)
        setItems(items.filter(i => i.id !== id))
    }

    return (
        <>
            <Header title="Base de Conocimiento" />

            <main className="flex-1 overflow-y-auto bg-zinc-50 p-6">

                {/* Stats / Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <Database size={24} />
                        </div>
                        <div>
                            <p className="text-zinc-500 text-sm font-medium">Fragmentos Totales</p>
                            <h3 className="text-2xl font-bold text-zinc-900">{items.length}</h3>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <RefreshCw size={24} />
                        </div>
                        <div>
                            <p className="text-zinc-500 text-sm font-medium">Última Actualización</p>
                            <h3 className="text-2xl font-bold text-zinc-900">
                                {items.length > 0 ? new Date(items[0].created_at).toLocaleDateString() : '-'}
                            </h3>
                        </div>
                    </div>

                    <div className="bg-indigo-600 p-6 rounded-xl border border-indigo-700 shadow-sm text-white flex flex-col justify-between relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="font-bold text-lg mb-1">Nuevo Conocimiento</h3>
                            <p className="text-indigo-200 text-sm mb-4">Agrega documentos o textos para entrenar a tu agente.</p>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-colors"
                            >
                                + Agregar Manualmente
                            </button>
                        </div>
                        <div className="absolute -right-6 -bottom-6 text-indigo-500 opacity-20">
                            <FileText size={120} />
                        </div>
                    </div>
                </div>

                {/* Knowledge List */}
                <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-zinc-200 flex justify-between items-center">
                        <h3 className="font-bold text-zinc-800">Fragmentos Indexados</h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar en conocimiento..."
                                className="pl-9 pr-4 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="p-12 text-center text-zinc-400">Cargando base de conocimiento...</div>
                    ) : items.length === 0 ? (
                        <div className="p-12 text-center text-zinc-400">
                            <Database size={48} className="mx-auto mb-4 opacity-20" />
                            <p>No hay conocimiento indexado aún.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-100">
                            {items.map((item) => (
                                <div key={item.id} className="p-6 hover:bg-zinc-50 transition-colors group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-1 rounded text-[10px] bg-zinc-100 text-zinc-600 border border-zinc-200 font-mono uppercase">
                                                {(item.metadata as any)?.source || 'Unknown'}
                                            </span>
                                            <span className="text-xs text-zinc-400">
                                                {new Date(item.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <p className="text-sm text-zinc-700 leading-relaxed font-mono bg-zinc-50/50 p-3 rounded border border-zinc-100">
                                        {item.content}
                                    </p>
                                    {(item.metadata as any)?.tags && (
                                        <div className="flex gap-2 mt-3">
                                            {(item.metadata as any).tags.map((tag: string, i: number) => (
                                                <span key={i} className="text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Manual Upload Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-zinc-900">Agregar Conocimiento</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-600">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleManualAdd} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Contenido (Texto)</label>
                                <textarea
                                    required
                                    value={newItemContent}
                                    onChange={(e) => setNewItemContent(e.target.value)}
                                    className="w-full h-32 border border-zinc-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
                                    placeholder="Ej: Nuestros competidores principales son X, Y y Z. Su debilidad es..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Tags (separados por coma)</label>
                                <input
                                    type="text"
                                    value={newItemTags}
                                    onChange={(e) => setNewItemTags(e.target.value)}
                                    className="w-full border border-zinc-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                    placeholder="competencia, precios, producto"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 text-zinc-600 font-medium hover:bg-zinc-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUploading}
                                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                >
                                    {isUploading ? 'Procesando...' : 'Guardar y Entrenar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
