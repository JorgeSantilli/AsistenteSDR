import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

/**
 * Endpoint PATCH para actualizar los datos de una interacción específica.
 * Cumple con la firma asíncrona de 'params' requerida por Next.js 16.
 * 
 * @param request - Objeto NextRequest con el body JSON { notes: string }.
 * @param context - Contexto que contiene la Promise de params con el 'id'.
 * @returns NextResponse con { success: true, data } o error.
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    // 1. Resolver params asíncronamente (Requerido en Next.js 16)
    const { id } = await params

    try {
        // 2. Parsear el body del request
        const body = await request.json()
        const { notes } = body

        // 3. Inicializar cliente de Supabase (Server Side)
        const supabase = await createClient()

        // 4. Ejecutar actualización en la base de datos
        const { data, error } = await supabase
            .from('interactions')
            .update({ notes })
            .eq('id', id)
            .select()
            .single()

        // 5. Manejar errores de base de datos
        if (error) {
            throw error
        }

        // 6. Retornar éxito
        return NextResponse.json({
            success: true,
            data
        })

    } catch (error: unknown) {
        // 7. Manejo centralizado de errores
        const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor'
        console.error(`[PATCH /api/interactions/${id}]:`, errorMessage)

        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        )
    }
}
