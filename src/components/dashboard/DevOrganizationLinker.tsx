'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'

/**
 * DevOrganizationLinker
 * 
 * Componente temporal para propósitos de desarrollo que asegura que el usuario
 * tenga una organización vinculada ("Pxsol Test").
 * Se monta en el Dashboard para corregir el error de "Usuario sin organización".
 */
export default function DevOrganizationLinker() {
    const [status, setStatus] = useState<'idle' | 'checking' | 'linking' | 'done' | 'error'>('idle')
    const [message, setMessage] = useState('')
    const supabase = createClient()

    useEffect(() => {
        async function setupOrg() {
            setStatus('checking')
            try {
                // 1. Obtener usuario actual
                const { data: { user }, error: userError } = await supabase.auth.getUser()
                if (userError || !user) {
                    setStatus('error')
                    setMessage('No se encontró sesión de usuario.')
                    return
                }

                // 2. Verificar si ya tiene organización
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('organization_id')
                    .eq('id', user.id)

                const profile = profiles && profiles.length > 0 ? profiles[0] : null

                if (profile?.organization_id) {
                    setStatus('done')
                    return // Ya tiene organización
                }

                // 3. Usar endpoint admin para evitar problemas de RLS
                setStatus('linking')
                setMessage('Configurando organización...')

                const response = await fetch('/api/admin/setup-org', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id })
                })

                const result = await response.json()

                if (!response.ok) {
                    throw new Error(result.error || 'Failed to setup organization')
                }

                setStatus('done')
                setMessage('Organización vinculada con éxito.')

                // Recargar para que los cambios surtan efecto
                setTimeout(() => {
                    window.location.reload()
                }, 2000)

            } catch (error: any) {
                // Solo logueamos detalles si existen
                if (error?.message) {
                    console.error('DevOrganizationLinker Error:', error.message)
                    if (error.hint) console.error('Hint:', error.hint)
                }
                setStatus('error')
                setMessage(error?.message || 'Error al configurar organización')
            }
        }

        setupOrg()
    }, [])

    if (status === 'done' && !message) return null

    return (
        <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 transition-colors ${status === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
            status === 'done' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                'bg-indigo-50 border-indigo-200 text-indigo-700'
            }`}>
            {status === 'checking' || status === 'linking' ? (
                <RefreshCw size={20} className="animate-spin" />
            ) : status === 'error' ? (
                <AlertCircle size={20} />
            ) : (
                <CheckCircle2 size={20} />
            )}
            <div className="flex-1">
                <p className="text-sm font-semibold">
                    {status === 'checking' ? 'Verificando cuenta...' :
                        status === 'linking' ? 'Configurando entorno...' :
                            status === 'error' ? 'Problema de configuración' :
                                'Entorno configurado'}
                </p>
                {message && <p className="text-xs opacity-80">{message}</p>}
            </div>
            {status === 'error' && (
                <button
                    onClick={() => window.location.reload()}
                    className="px-3 py-1 bg-white border border-red-200 rounded-lg text-xs font-bold hover:bg-red-100"
                >
                    Reintentar
                </button>
            )}
        </div>
    )
}
