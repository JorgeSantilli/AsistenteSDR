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

                // 2. Verificar perfil y organización
                const { data: profiles, error: profileError } = await supabase
                    .from('profiles')
                    .select('organization_id')
                    .eq('id', user.id)

                if (profileError) {
                    console.error('Error fetching profile:', profileError)
                    // No cortamos aquí, intentamos crear el perfil más adelante
                }

                const profile = profiles && profiles.length > 0 ? profiles[0] : null

                if (profile?.organization_id) {
                    setStatus('done')
                    return // Ya tiene organización
                }

                setStatus('linking')
                setMessage('Configurando "Pxsol Test"...')

                // 3. Buscar o crear la organización "Pxsol Test"
                let orgId: string

                const { data: existingOrgs } = await supabase
                    .from('organizations')
                    .select('id')
                    .eq('name', 'Pxsol Test')

                if (existingOrgs && existingOrgs.length > 0) {
                    orgId = existingOrgs[0].id
                } else {
                    const { data: newOrg, error: orgError } = await supabase
                        .from('organizations')
                        .insert({ name: 'Pxsol Test' })
                        .select()
                        .single()

                    if (orgError) throw orgError
                    orgId = newOrg.id
                }

                // 4. Asegurar perfil y vincular
                const { error: upsertError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: user.id,
                        organization_id: orgId,
                        full_name: user.user_metadata?.full_name || 'Jorge Santilli'
                    })

                if (upsertError) throw upsertError

                setStatus('done')
                setMessage('Organización "Pxsol Test" vinculada con éxito.')

                // Recargar para que los cambios surtan efecto en otros componentes
                setTimeout(() => {
                    console.log('Reloading page to apply organization changes...')
                    window.location.reload()
                }, 2000)

            } catch (error: any) {
                console.error('Error detailed in DevOrganizationLinker:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                })
                setStatus('error')
                setMessage(`Error: ${error.message || 'Error desconocido'}`)
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
