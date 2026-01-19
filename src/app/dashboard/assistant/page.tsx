import AssistantClient from './AssistantClient'

/**
 * Server Component que actúa como entry-point para el Asistente en vivo.
 * Forzamos renderizado dinámico para evitar errores de inicialización de Supabase
 * durante la fase de build estático (SSG) de Next.js.
 */

export const dynamic = 'force-dynamic'

export default function AssistantPage() {
    return <AssistantClient />
}
