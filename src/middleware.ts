import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/server-utils'

/**
 * Middleware de Next.js para manejar la sesión de Supabase.
 * TODO: En futuras versiones de la arquitectura, considerar mover lógica persistente a /app/proxy.ts 
 * si se decide desacoplar el manejo de sesiones del middleware principal.
 */
export async function middleware(request: NextRequest) {
    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - api/ (API routes - generally we might want to protect them too, but let's allow public access for now or handle inside)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
