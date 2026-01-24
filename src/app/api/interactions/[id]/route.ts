import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

/**
 * Endpoint PATCH para actualizar los datos de una interacción específica.
 * Implementación 100% compatible con Next.js 16 (Async Params).
 */
export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const { id } = params;

    try {
        const { notes } = await request.json()
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('interactions')
            .update({ notes })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            throw error
        }

        return NextResponse.json({
            success: true,
            data
        })

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor'
        console.error(`[PATCH /api/interactions/${id}]:`, errorMessage)

        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        )
    }
}
