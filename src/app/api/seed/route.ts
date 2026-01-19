import { createClient } from '@supabase/supabase-js'
import { OpenAI } from 'openai'
import { NextResponse } from 'next/server'
import { Database } from '@/lib/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const openaiKey = process.env.OPENAI_API_KEY

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
const openai = new OpenAI({ apiKey: openaiKey })

const INITIAL_KNOWLEDGE = [
    {
        content: `Pxsol es una plataforma "all-in-one" de tecnología hotelera diseñada para potenciar las ventas directas y optimizar la gestión operativa. Su propuesta de valor es "Tecnología para potenciar tu hotel", enfocándose en disminuir comisiones pagadas a OTAs, centralizar la distribución y unificar la gestión.`,
        tags: ['resumen', 'propuesta_valor']
    },
    {
        content: `Motor de Reservas de Pxsol: Permite obtener reservas directas libres de comisiones. Soporta múltiples idiomas y monedas, y mantiene la disponibilidad sincronizada en tiempo real para evitar overbooking.`,
        tags: ['producto', 'motor_reservas', 'beneficios']
    },
    {
        content: `PMS (Property Management System) de Pxsol: Gestión integral del hotel desde un solo panel. Permite el control total de estancias, huéspedes, facturación y operaciones diarias.`,
        tags: ['producto', 'pms', 'operaciones']
    },
    {
        content: `Channel Manager de Pxsol: Distribución centralizada que sincroniza el inventario con las principales agencias de viajes online (Booking, Expedia, etc.). Su principal beneficio es evitar la sobreventa (overbooking) y ahorrar tiempo de gestión manual.`,
        tags: ['producto', 'channel_manager', 'distribucion']
    },
    {
        content: `Pxsol Ads: Servicio de publicidad automatizada en Google (Google Hotel Ads) diseñado para atraer tráfico directo al motor de reservas con un alto retorno de inversión (ROI), compitiendo directamente con las OTAs en los resultados de búsqueda.`,
        tags: ['producto', 'marketing', 'pxsol_ads']
    },
    {
        content: `Integraciones y Pagos: Pxsol se integra con pasarelas de pago como Stripe y Payway para el cobro automático. También se integra con sistemas de facturación (como GNS en Uruguay) y herramientas de Revenue Management como Turbosuite.`,
        tags: ['integraciones', 'pagos', 'tecnico']
    },
    {
        content: ` CRM Hotelero: Herramienta para el seguimiento de consultas y automatización de procesos de venta. Ayuda en la fidelización de huéspedes mediante marketing personalizado y bases de datos centralizadas.`,
        tags: ['producto', 'crm', 'ventas']
    },
    {
        content: ` Beneficios clave para el Hotelero: 1) Ahorro: Cero comisiones en reservas directas. 2) Seguridad: Eliminación del riesgo de sobreventa. 3) Eficiencia: Todo en una sola plataforma. 4) Visibilidad: Presencia automática en Google.`,
        tags: ['beneficios', 'argumentario_ventas']
    }
]

export async function GET(req: Request) {
    try {
        const orgId = '00000000-0000-0000-0000-000000000000' // Default ID used in frontend

        // Ensure Organization exists
        const { error: orgError } = await supabase.from('organizations').upsert({
            id: orgId,
            name: 'Demo Organization',
            settings: { plan: 'trial' }
        })

        if (orgError) {
            console.error("Org Upsert Error:", orgError)
            throw orgError
        }

        // Check if data exists
        const { count } = await supabase.from('knowledge_base').select('*', { count: 'exact', head: true })
        if (count && count > 0) {
            return NextResponse.json({ message: 'Database already seeded', count })
        }

        const results = []

        for (const item of INITIAL_KNOWLEDGE) {
            // Generate Embedding
            const embeddingResponse = await openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: item.content,
            })

            const embedding = embeddingResponse.data[0].embedding

            // Insert into Supabase
            const { data, error } = await supabase.from('knowledge_base').insert({
                organization_id: orgId,
                content: item.content,
                embedding: embedding as any, // Pass array directly
                metadata: { tags: item.tags, source: 'seed_script' }
            }).select()

            if (error) {
                console.error("Supabase Insert Error:", error)
                throw error
            }
            results.push(data[0])
        }

        return NextResponse.json({ success: true, inserted: results.length, data: results })

    } catch (error: any) {
        console.error("Seed Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
