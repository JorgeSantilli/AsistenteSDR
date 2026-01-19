'use client'

import React, { useState } from 'react'
import { X, Building2, User, Phone, Mail, DollarSign, Target, Clock, MessageSquare, Sparkles, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'

/**
 * Propiedades para el componente NewDealModal.
 */
interface NewDealModalProps {
    /** Indica si el modal está abierto. */
    isOpen: boolean
    /** Función para cerrar el modal. */
    onClose: () => void
    /** Callback que se ejecuta tras la creación exitosa de un negocio. */
    onSuccess: () => void
}

/**
 * Componente Modal para la creación de nuevas oportunidades de negocio.
 * Permite capturar información de la empresa, contacto y parámetros específicos para el asistente de IA.
 * 
 * @param props - NewDealModalProps
 */
export default function NewDealModal({ isOpen, onClose, onSuccess }: NewDealModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        company: '',
        contact_name: '',
        contact_phone: '',
        contact_email: '',
        value: '',
        target_calls: '3',
        target_duration: '15',
        tone: 'Professional',
        notes: ''
    })

    const supabase = createClient()

    if (!isOpen) return null

    /**
     * Maneja el envío del formulario para crear un nuevo negocio en Supabase.
     * Recupera el organization_id del perfil del usuario antes de insertar.
     * 
     * @param e - Evento de formulario
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('No se encontró un usuario autenticado')

            const { data: profile } = await supabase
                .from('profiles')
                .select('organization_id')
                .eq('id', userData.user.id)
                .single()

            if (!profile?.organization_id) throw new Error('El usuario no pertenece a ninguna organización')

            const { error } = await supabase.from('deals').insert({
                title: formData.title,
                company: formData.company,
                contact_name: formData.contact_name,
                contact_phone: formData.contact_phone,
                contact_email: formData.contact_email,
                value: parseFloat(formData.value) || 0,
                organization_id: profile.organization_id,
                stage: 'Discovery',
                status: 'Open',
                probability: 10,
                tracking_config: {
                    target_calls: parseInt(formData.target_calls) || 3,
                    target_duration: parseInt(formData.target_duration) || 15,
                    tone: formData.tone || 'Professional',
                    notes: formData.notes || ''
                }
            })

            if (error) throw error

            onSuccess()
            onClose()
        } catch (error: any) {
            console.error('Error creating deal:', error)
            const errorMessage = error.message || 'Error desconocido'
            alert(`Error al crear la oportunidad: ${errorMessage}`)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop con desenfoque */}
            <div
                className="absolute inset-0 bg-zinc-900/40 backdrop-blur-md transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Contenido del Modal */}
            <div className="relative bg-white/90 backdrop-blur-xl w-full max-w-2xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden transform transition-all duration-300 scale-100">
                {/* Decoración superior con gradiente */}
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                <div className="p-8">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-3xl font-black text-zinc-900 flex items-center gap-2">
                                <Sparkles className="text-indigo-600" size={28} />
                                Nueva Oportunidad
                            </h2>
                            <p className="text-zinc-500 mt-1">Configure los parámetros del negocio y del asistente IA.</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-600 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Sección 1: Info Básica */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700 flex items-center gap-2 px-1">
                                    <Target size={14} className="text-indigo-500" /> Título del Negocio
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej: Expansión Regional"
                                    className="w-full bg-white/50 border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700 flex items-center gap-2 px-1">
                                    <Building2 size={14} className="text-indigo-500" /> Empresa
                                </label>
                                <input
                                    type="text"
                                    placeholder="Nombre de la compañía"
                                    className="w-full bg-white/50 border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                                    value={formData.company}
                                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Sección 2: Info de Contacto */}
                        <div className="bg-zinc-50/50 rounded-2xl p-4 border border-zinc-100 space-y-4">
                            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest px-1">Información de Contacto</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 flex items-center gap-2 px-1">
                                        <User size={12} /> Contacto
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Nombre completo"
                                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-all"
                                        value={formData.contact_name}
                                        onChange={e => setFormData({ ...formData, contact_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 flex items-center gap-2 px-1">
                                        <Phone size={12} /> Teléfono
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="+54..."
                                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-all"
                                        value={formData.contact_phone}
                                        onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 flex items-center gap-2 px-1">
                                        <Mail size={12} /> Email
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="correo@empresa.com"
                                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-all"
                                        value={formData.contact_email}
                                        onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sección 3: Valor y Parámetros IA */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <label className="text-sm font-bold text-zinc-700 flex items-center gap-2 px-1">
                                    <DollarSign size={14} className="text-emerald-500" /> Valor Estimado
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        className="w-full bg-white/50 border border-zinc-200 rounded-xl pl-8 pr-4 py-3 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                                        value={formData.value}
                                        onChange={e => setFormData({ ...formData, value: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-bold text-zinc-700 flex items-center gap-2 px-1">
                                    <MessageSquare size={14} className="text-indigo-500" /> Tono de Llamada (IA)
                                </label>
                                <select
                                    className="w-full bg-white/50 border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm appearance-none"
                                    value={formData.tone}
                                    onChange={e => setFormData({ ...formData, tone: e.target.value })}
                                >
                                    <option value="Professional">Profesional / Consultivo</option>
                                    <option value="Friendly">Amigable / Cercano</option>
                                    <option value="Challenging">Desafiante / Persuasivo</option>
                                    <option value="Formal">Formal / Estructural</option>
                                </select>
                            </div>
                        </div>

                        {/* Sección 4: Parámetros de Monitoreo IA */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 flex items-center gap-2 px-1">
                                    <Target size={12} /> Objetivo Llamadas
                                </label>
                                <input
                                    type="number"
                                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-all"
                                    value={formData.target_calls}
                                    onChange={e => setFormData({ ...formData, target_calls: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 flex items-center gap-2 px-1">
                                    <Clock size={12} /> Duración Ideal (Min)
                                </label>
                                <input
                                    type="number"
                                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-all"
                                    value={formData.target_duration}
                                    onChange={e => setFormData({ ...formData, target_duration: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 pt-4 border-t border-zinc-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 px-4 border border-zinc-200 text-zinc-600 font-bold rounded-2xl hover:bg-zinc-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-[2] py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/30 active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Creando...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-5 h-5" />
                                        Crear Oportunidad
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
