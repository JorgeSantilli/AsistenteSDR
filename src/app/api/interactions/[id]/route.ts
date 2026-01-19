import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

/**
 * Endpoint PATCH para actualizar los datos de una interacción específica.
 * Actualmente se utiliza para actualizar las notas post-llamada.
 * 
 * @param request - Objeto Request con { notes } en el body.
 * @param params - { id: string } ID de la interacción a actualizar.
 * @returns NextResponse con el resultado de la actualización.
 */
export async function PATCH(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const { notes } = await request.json()
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('interactions')
            .update({ notes })
            .eq('id', params.id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ success: true, data })
    } catch (error: any) {
        console.error('Error updating notes:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
