import { createClient } from '@supabase/supabase-js'
import { OpenAI } from 'openai'
import { NextResponse } from 'next/server'
import { Database } from '@/lib/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const openaiKey = process.env.OPENAI_API_KEY

if (!openaiKey) {
    console.error("OPENAI_API_KEY is not set")
}

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
const openai = new OpenAI({ apiKey: openaiKey })

/**
 * Endpoint POST para obtener sugerencias de IA basadas en el contexto de la llamada actual.
 * Realiza una búsqueda semántica (RAG) en Supabase y genera una respuesta optimizada para el SDR.
 * 
 * @param req - Objeto Request con { transcript, organization_id } en el body.
 * @returns NextResponse con la sugerencia de IA y los documentos de contexto utilizados.
 */
export async function POST(req: Request) {
    try {
        const { transcript, organization_id } = await req.json()

        if (!transcript || !organization_id) {
            return NextResponse.json({ error: 'Missing transcript or organization_id' }, { status: 400 })
        }

        // 1. Generar Embedding para el fragmento de transcripción (query)
        const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: transcript,
        })

        const embedding = embeddingResponse.data[0].embedding

        // 2. Búsqueda Vectorial en Supabase
        // Llama a la función RPC 'match_documents' que realiza la similitud de coseno
        const { data: documents, error: searchError } = await supabase.rpc('match_documents', {
            query_embedding: embedding,
            match_threshold: 0.7, // Umbral de similitud (ajustable)
            match_count: 5,        // Número de fragmentos a recuperar
            filter: { organization_id: organization_id } // Aislamiento multi-tenant
        })

        if (searchError) {
            console.error("Supabase Search Error:", searchError)
            return NextResponse.json({ error: searchError.message }, { status: 500 })
        }

        // 3. Generar respuesta con el Co-Piloto (Manejo de Objeciones)
        // Construimos el contexto textual a partir de los documentos recuperados
        const contextText = (documents as any[])?.map((d: any) => d.content).join("\n---\n") || ""

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `Eres un Ingeniero de Ventas élite para Pxsol, una plataforma tecnológica hotelera "todo en uno".
          
          TU OBJETIVO: Proporcionar una respuesta corta, contundente y ganadora a la objeción o consulta del prospecto.
          
          DIRECTRICES:
          1. USA EL CONTEXTO: Confía estrictamente en las características específicas de Pxsol, integraciones (Stripe, Payway, Turbosuite) y beneficios (0% comisiones) que se encuentran en el CONTEXTO a continuación.
          2. SÉ CONCISO: El SDR está en una llamada en vivo. Mantén la sugerencia en menos de 2 oraciones si es posible.
          3. TONO: Profesional, seguro y orientado al valor.
          4. FORMATO: Discurso directo. No digas "Deberías decir...", solo da la línea.
          5. IDIOMA: SIEMPRE responde en ESPAÑOL.

          CONTEXTO DE LA BASE DE CONOCIMIENTO:
          ${contextText}
          
          Si el contexto está vacío o es irrelevante, recurre a las mejores prácticas generales de ventas SaaS pero menciona "nuestra plataforma todo en uno".`
                },
                { role: "user", content: `El prospecto dice: "${transcript}"` }
            ],
            temperature: 0.6,
        })

        const suggestion = completion.choices[0].message.content

        return NextResponse.json({
            suggestion,
            context_used: (documents as any[])?.map((d: any) => ({ content: d.content, metadata: d.metadata }))
        })

    } catch (error) {
        console.error("API Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
