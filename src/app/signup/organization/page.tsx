'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, ArrowRight, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

export default function CreateOrgPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [orgName, setOrgName] = useState('')
    const [fullName, setFullName] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [step, setStep] = useState<'form' | 'success'>('form')
    const [error, setError] = useState<string | null>(null)

    const router = useRouter()
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            // 1. Sign Up User
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName
                    }
                }
            })

            if (authError) throw authError

            // Check for existing user (Supabase sometimes returns success for existing emails for security)
            if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
                throw new Error("Este correo electrónico ya está registrado. Por favor inicia sesión.")
            }

            if (!authData.user) throw new Error("No se pudo crear el usuario")

            // 2. Create Organization via Admin API (bypasses RLS)
            // Note: In production, we should probably wait for email confirmation,
            // but for this flow we assume immediate session or handle it gracefully.
            // If email confirmation is required, the user won't have a session yet.

            // However, usually signUp returns a session if "Enable Email Confirmation" is OFF.
            // If ON, we can't create the org yet properly without a session or trusted backend flow.
            // We'll perform the API call. The API uses service_role so it doesn't need the user to be fully logged in,
            // just needs the userId.

            const response = await fetch('/api/admin/setup-org', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: authData.user.id,
                    organizationName: orgName,
                    fullName: fullName
                })
            })

            const result = await response.json()

            if (!response.ok) {
                console.error('Org creation failed:', result)
                throw new Error(result.error || 'Error al configurar la organización')
            }

            setStep('success')

        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Ocurrió un error inesperado')
        } finally {
            setIsLoading(false)
        }
    }

    if (step === 'success') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
                <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center animate-fade-in">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500">
                        <CheckCircle2 size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">¡Cuenta Creada!</h2>
                    <p className="text-zinc-500 mb-8">
                        Tu organización <strong>{orgName}</strong> ha sido configurada correctamente.
                        {/* If email confirm is on, mention it here */}
                        <br />Te hemos enviado un correo de confirmación.
                    </p>
                    <Link
                        href="/login"
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        Ir a Iniciar Sesión <ArrowRight size={18} />
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
                <div className="flex flex-col items-center gap-4 mb-8">
                    <div className="bg-indigo-500/10 p-3 rounded-full text-indigo-400">
                        <Building2 size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-white text-center">
                        Crea tu Organización
                    </h1>
                    <p className="text-zinc-500 text-sm text-center">
                        Comienza tu prueba gratuita y potencia tu equipo de ventas.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Nombre Completo</label>
                        <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="Juan Pérez"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Nombre de la Organización</label>
                        <input
                            type="text"
                            required
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="Mi Empresa S.A."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Email Profesional</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="tunar@empresa.com"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Contraseña</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors pr-10"
                                placeholder="Mínimo 6 caracteres"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Crear Cuenta y Organización'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-zinc-500">
                    <p>
                        ¿Ya tienes una cuenta?{' '}
                        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline">
                            Iniciar Sesión
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
