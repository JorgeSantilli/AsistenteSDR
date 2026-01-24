'use client'

import React, { useState, useEffect } from 'react'
import {
    X,
    Activity,
    Users,
    Brain,
    Clock,
    Phone,
    Mail,
    Plus,
    MessageSquare,
    Loader2,
    Calendar,
    ChevronRight,
    UserPlus,
    Trash2
} from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'

type TabType = 'activities' | 'contacts' | 'intelligence'

interface OpportunityDrawerProps {
    isOpen: boolean
    onClose: () => void
    dealId: string | null
}

export default function OpportunityDrawer({ isOpen, onClose, dealId }: OpportunityDrawerProps) {
    const [activeTab, setActiveTab] = useState<TabType>('activities')
    const [deal, setDeal] = useState<any>(null)
    const [activities, setActivities] = useState<any[]>([])
    const [contacts, setContacts] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isActionLoading, setIsActionLoading] = useState(false)
    const [newNote, setNewNote] = useState('')
    const [showContactForm, setShowContactForm] = useState(false)
    const [newContact, setNewContact] = useState({ full_name: '', email: '', phone: '', job_title: '' })
    const [intelligenceSummary, setIntelligenceSummary] = useState<string | null>(null)

    const supabase = createClient()

    useEffect(() => {
        if (isOpen && dealId) {
            loadDealData()
        } else {
            // Reset state when closed
            setDeal(null)
            setActivities([])
            setContacts([])
            setIntelligenceSummary(null)
            setActiveTab('activities')
        }
    }, [isOpen, dealId])

    const loadDealData = async () => {
        if (!dealId) return
        setIsLoading(true)
        try {
            // 1. Load Deal
            const { data: dealData } = await supabase
                .from('deals')
                .select('*')
                .eq('id', dealId)
                .single()
            setDeal(dealData)

            // 2. Load Activities (Notes + Calls/Interactions)
            const { data: actData } = await supabase
                .from('activities')
                .select('*, profiles(full_name)')
                .eq('deal_id', dealId)
                .order('created_at', { ascending: false })

            // Also load interactions as activities
            const { data: intData } = await supabase
                .from('interactions')
                .select('*')
                .eq('deal_id', dealId)
                .order('created_at', { ascending: false })

            const mergedActivities = [
                ...(actData || []),
                ...(intData || []).map(i => ({
                    id: i.id,
                    type: 'call',
                    content: i.notes || 'Llamada realizada',
                    created_at: i.created_at,
                    metadata: { duration: i.duration_seconds, status: i.status }
                }))
            ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

            setActivities(mergedActivities)

            // 3. Load Contacts
            const { data: contactLinks } = await supabase
                .from('deal_contacts')
                .select('*, contacts(*)')
                .eq('deal_id', dealId)

            setContacts(contactLinks || [])

        } catch (error) {
            console.error('Error loading deal data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newNote.trim() || !dealId) return
        setIsActionLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            const { error } = await supabase
                .from('activities')
                .insert({
                    deal_id: dealId,
                    organization_id: deal.organization_id,
                    type: 'note',
                    content: newNote,
                    user_id: user?.id
                })

            if (error) throw error
            setNewNote('')
            loadDealData()
        } catch (error) {
            console.error('Error adding note:', error)
        } finally {
            setIsActionLoading(false)
        }
    }

    const handleAddContact = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newContact.full_name || !dealId) return
        setIsActionLoading(true)
        try {
            // 1. Create Contact
            const { data: contact, error: contactError } = await supabase
                .from('contacts')
                .insert({
                    ...newContact,
                    organization_id: deal.organization_id
                })
                .select()
                .single()

            if (contactError) throw contactError

            // 2. Link to Deal
            const { error: linkError } = await supabase
                .from('deal_contacts')
                .insert({
                    deal_id: dealId,
                    contact_id: contact.id,
                    role: 'Stakeholder'
                })

            if (linkError) throw linkError

            setNewContact({ full_name: '', email: '', phone: '', job_title: '' })
            setShowContactForm(false)
            loadDealData()
        } catch (error) {
            console.error('Error adding contact:', error)
        } finally {
            setIsActionLoading(false)
        }
    }

    const generateIntelligence = async () => {
        setIsActionLoading(true)
        try {
            // Simulated AI call for now (on-demand)
            await new Promise(resolve => setTimeout(resolve, 1500))

            const lastCall = activities.find(a => a.type === 'call')
            const notes = activities.filter(a => a.type === 'note')

            let summary = `La oportunidad "${deal?.title}" se encuentra en etapa de ${deal?.stage}. `
            if (lastCall) {
                summary += `Se realizó una llamada recientemente (${new Date(lastCall.created_at).toLocaleDateString()}). `
            }
            if (notes.length > 0) {
                summary += `Hay ${notes.length} notas de seguimiento registradas. `
            } else {
                summary += "No hay notas recientes, se recomienda mayor contacto. "
            }

            summary += "\n\nInsights: El prospecto parece interesado en la reducción de costos operativos. Se sugiere enviar propuesta técnica en la siguiente interacción."

            setIntelligenceSummary(summary)
        } catch (error) {
            console.error('Error generating summary:', error)
        } finally {
            setIsActionLoading(false)
        }
    }

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Drawer */}
            <div className={`
                fixed top-0 right-0 h-screen bg-white shadow-2xl z-[101] w-full md:w-[600px] transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : 'translate-x-full'}
            `}>
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-500">
                        <Loader2 className="animate-spin" size={32} />
                        <p>Cargando detalles...</p>
                    </div>
                ) : !deal ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center text-zinc-500">
                        <p>No se pudo cargar la información de la oportunidad.</p>
                        <button onClick={onClose} className="mt-4 text-indigo-600 font-medium">Cerrar</button>
                    </div>
                ) : (
                    <div className="flex flex-col h-full">
                        {/* Header */}
                        <div className="p-6 border-b border-zinc-100">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-zinc-900">{deal.company}</h2>
                                    <p className="text-zinc-500">{deal.title}</p>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                                    <X size={20} className="text-zinc-400" />
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-center">
                                    <p className="text-[10px] uppercase font-bold text-emerald-600 mb-1">Health Score</p>
                                    <p className="text-xl font-bold text-emerald-700">{deal.probability}%</p>
                                </div>
                                <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl text-center">
                                    <p className="text-[10px] uppercase font-bold text-indigo-600 mb-1">Forecast</p>
                                    <p className="text-sm font-bold text-indigo-700 truncate">{deal.stage}</p>
                                </div>
                                <div className="bg-purple-50 border border-purple-100 p-3 rounded-xl text-center">
                                    <p className="text-[10px] uppercase font-bold text-purple-600 mb-1">Primary DM</p>
                                    <p className="text-xs font-bold text-purple-700 truncate">{deal.contact_name || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Tabs Navigation */}
                        <div className="flex border-b border-zinc-100 px-6">
                            {[
                                { id: 'activities', label: 'Actividades', icon: Activity },
                                { id: 'contacts', label: 'Contactos', icon: Users },
                                { id: 'intelligence', label: 'Inteligencia', icon: Brain },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabType)}
                                    className={`
                                        flex items-center gap-2 py-4 px-4 border-b-2 transition-all font-medium text-sm
                                        ${activeTab === tab.id
                                            ? 'border-indigo-600 text-indigo-600'
                                            : 'border-transparent text-zinc-500 hover:text-zinc-700'}
                                    `}
                                >
                                    <tab.icon size={18} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/50">
                            {activeTab === 'activities' && (
                                <div className="space-y-6">
                                    {/* New Note Form */}
                                    <form onSubmit={handleAddNote} className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm transition-all focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500">
                                        <textarea
                                            value={newNote}
                                            onChange={(e) => setNewNote(e.target.value)}
                                            placeholder="Agregar una nota rápida..."
                                            className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm resize-none h-16"
                                        />
                                        <div className="flex justify-end mt-2">
                                            <button
                                                disabled={isActionLoading || !newNote.trim()}
                                                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
                                            >
                                                {isActionLoading && <Loader2 size={14} className="animate-spin" />}
                                                Guardar Nota
                                            </button>
                                        </div>
                                    </form>

                                    {/* Timeline */}
                                    <div className="relative space-y-4">
                                        {activities.length === 0 ? (
                                            <div className="py-12 text-center text-zinc-500">
                                                <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <MessageSquare size={20} className="text-zinc-400" />
                                                </div>
                                                <p className="text-sm">No hay actividades registradas aún.</p>
                                            </div>
                                        ) : (
                                            activities.map((act) => (
                                                <div key={act.id} className="flex gap-4 relative group">
                                                    <div className="flex flex-col items-center">
                                                        <div className={`
                                                            w-10 h-10 rounded-xl flex items-center justify-center shadow-sm z-10
                                                            ${act.type === 'call' ? 'bg-emerald-100 text-emerald-600' :
                                                                act.type === 'note' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}
                                                        `}>
                                                            {act.type === 'call' ? <Phone size={18} /> :
                                                                act.type === 'note' ? <MessageSquare size={18} /> : <Activity size={18} />}
                                                        </div>
                                                        <div className="w-px h-full bg-zinc-200 absolute top-10 left-5 -z-0" />
                                                    </div>
                                                    <div className="flex-1 bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm mb-4">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="text-xs font-bold text-zinc-900 uppercase">
                                                                {act.type === 'call' ? 'Llamada Registrada' : 'Nota de SDR'}
                                                            </p>
                                                            <p className="text-[10px] text-zinc-400 font-medium">
                                                                {new Date(act.created_at).toLocaleString()}
                                                            </p>
                                                        </div>
                                                        <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">
                                                            {act.content}
                                                        </p>
                                                        <div className="mt-3 flex items-center gap-2">
                                                            <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white">
                                                                {act.profiles?.full_name?.charAt(0) || 'S'}
                                                            </div>
                                                            <p className="text-xs text-zinc-500 font-medium">
                                                                {act.profiles?.full_name || 'Sistema'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'contacts' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-zinc-900">Stakeholders Vinculados</h3>
                                        <button
                                            onClick={() => setShowContactForm(!showContactForm)}
                                            className="text-indigo-600 hover:text-indigo-700 text-xs font-bold flex items-center gap-1"
                                        >
                                            {showContactForm ? 'Cancelar' : <><Plus size={14} /> Nuevo Contacto</>}
                                        </button>
                                    </div>

                                    {showContactForm && (
                                        <form onSubmit={handleAddContact} className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300 mb-6">
                                            <div className="space-y-3">
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="Nombre completo"
                                                    value={newContact.full_name}
                                                    onChange={e => setNewContact({ ...newContact, full_name: e.target.value })}
                                                    className="w-full text-sm border-zinc-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Cargo (ej: CTO)"
                                                    value={newContact.job_title}
                                                    onChange={e => setNewContact({ ...newContact, job_title: e.target.value })}
                                                    className="w-full text-sm border-zinc-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                                />
                                                <input
                                                    type="email"
                                                    placeholder="Email"
                                                    value={newContact.email}
                                                    onChange={e => setNewContact({ ...newContact, email: e.target.value })}
                                                    className="w-full text-sm border-zinc-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                                />
                                                <input
                                                    type="tel"
                                                    placeholder="Teléfono (ej: +54 9 11 ...)"
                                                    value={newContact.phone}
                                                    onChange={e => setNewContact({ ...newContact, phone: e.target.value })}
                                                    className="w-full text-sm border-zinc-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                                />
                                                <button
                                                    className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all"
                                                >
                                                    {isActionLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Crear y Vincular'}
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    <div className="grid gap-3">
                                        {contacts.length === 0 ? (
                                            <div className="py-12 text-center text-zinc-500 bg-white rounded-2xl border border-dashed border-zinc-200">
                                                <UserPlus size={24} className="mx-auto mb-4 text-zinc-300" />
                                                <p className="text-sm">No hay contactos vinculados.</p>
                                            </div>
                                        ) : (
                                            contacts.map((link) => (
                                                <div key={link.id} className="bg-white p-4 rounded-2xl border border-zinc-200 flex items-center justify-between group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-sm font-bold text-zinc-500">
                                                            {link.contacts.full_name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-zinc-900">{link.contacts.full_name}</p>
                                                            <p className="text-xs text-zinc-500">
                                                                {link.contacts.job_title || 'Sin cargo'}
                                                                {link.contacts.phone && ` • ${link.contacts.phone}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400">
                                                            <Mail size={16} />
                                                        </button>
                                                        <button className="p-2 hover:bg-red-50 rounded-lg text-red-400">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'intelligence' && (
                                <div className="space-y-6">
                                    <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-6 rounded-[2rem] text-white shadow-xl shadow-indigo-600/20">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                                                <Brain size={22} className="text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold">AI Opportunity Insights</h3>
                                                <p className="text-xs text-white/70">Análisis on-demand del proceso comercial</p>
                                            </div>
                                        </div>

                                        {!intelligenceSummary ? (
                                            <div className="py-4 text-center">
                                                <button
                                                    onClick={generateIntelligence}
                                                    disabled={isActionLoading}
                                                    className="bg-white text-indigo-600 px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all flex items-center gap-2 mx-auto"
                                                >
                                                    {isActionLoading ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
                                                    Generar Resumen
                                                </button>
                                                <p className="text-[10px] text-white/60 mt-3 italic">Basado en las llamadas y notas registradas</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4 animate-in fade-in duration-700">
                                                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                                                    {intelligenceSummary}
                                                </div>
                                                <button
                                                    onClick={() => setIntelligenceSummary(null)}
                                                    className="text-xs text-white/60 hover:text-white underline"
                                                >
                                                    Actualizar análisis
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Additional Static Insights */}
                                    <div className="grid gap-3">
                                        <div className="bg-white p-4 rounded-2xl border border-zinc-200">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Calendar size={14} className="text-indigo-600" />
                                                <span className="text-xs font-bold uppercase text-zinc-400">Próximo paso sugerido</span>
                                            </div>
                                            <p className="text-sm font-medium text-zinc-900 italic">"Programar demo técnica antes del fin de semana para no perder momentum."</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-zinc-100 bg-white flex justify-between gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 border border-zinc-200 rounded-xl text-zinc-600 font-bold hover:bg-zinc-50 transition-all text-sm"
                            >
                                Cerrar
                            </button>
                            <button className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1 transition-all text-sm">
                                Actualizar Etapa
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
