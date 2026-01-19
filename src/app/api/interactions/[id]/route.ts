import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

/**
 * Endpoint PATCH para actualizar los datos de una interacción específica.
 * Cumple con la firma asíncrona de 'params' requerida por Next.js 16.
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    // En Next.js 16, params debe ser esperado antes de acceder a sus propiedades
    const { id } = await params

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
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error('Error updating interaction notes:', message)

        return NextResponse.json(
            { error: message },
            { status: 500 }
        )
    }
}
