import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

/**
 * Endpoint POST para ingesta de documentos en la base de conocimientos.
 * Genera embeddings automáticamente y almacena en Supabase.
 */
export async function POST(request: NextRequest) {
    try {
        const openaiKey = process.env.OPENAI_API_KEY
        if (!openaiKey) {
            return NextResponse.json({ error: 'OpenAI API Key not configured' }, { status: 500 })
        }

        const openai = new OpenAI({ apiKey: openaiKey })
        const { content, tags, source } = await request.json()
        const supabase = await createClient()

        // 1. Get User and secure Organization ID
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized: No valid session' }, { status: 401 })
        }

        // Recuperar la organización asociada al usuario (asumiendo relación en tabla members o user_metadata)
        // Por ahora, mantenemos la lógica de buscar la primera organización donde el usuario es miembro
        // TODO: Mejorar esto con selección explícita de organización en el header o contexto
        const { data: memberData, error: memberError } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .limit(1)
            .single()

        let orgId: string

        if (memberData) {
            orgId = memberData.organization_id
        } else {
            // Fallback for prototypes or if members table isn't fully populated yet: 
            // Try to find ANY org (use with caution in prod) or create one context
            // Revisando si existe tabla organizations directa linked to user?
            // Asumiremos que debe existir membresía. Si no, error.

            // Check if user is owner directly in organizations table? (Depends on schema)
            // Let's try to fetch an org created by this user if member lookup fails
            const { data: orgs } = await supabase.from('organizations').select('id').eq('owner_id', user.id).limit(1)
            if (orgs && orgs.length > 0) {
                orgId = orgs[0].id
            } else {
                return NextResponse.json({ error: 'No Organization Found for this user' }, { status: 400 })
            }
        }

        // 2. Chunking Logic (Simple overlap splitting)
        const CHUNK_SIZE = 1000;
        const CHUNK_OVERLAP = 200;

        const chunks: string[] = [];
        if (content.length <= CHUNK_SIZE) {
            chunks.push(content);
        } else {
            let start = 0;
            while (start < content.length) {
                const end = Math.min(start + CHUNK_SIZE, content.length);
                const chunk = content.slice(start, end);
                chunks.push(chunk);
                start += (CHUNK_SIZE - CHUNK_OVERLAP);
            }
        }

        console.log(`Processing ${chunks.length} chunks for ingest...`);

        // 3. Generate Embeddings & Store for each chunk
        const results = [];

        for (const chunkContent of chunks) {
            const embeddingResponse = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: chunkContent,
                encoding_format: "float",
            });

            const embedding = embeddingResponse.data[0].embedding;

            const { data, error } = await supabase.from('knowledge_base').insert({
                organization_id: orgId,
                content: chunkContent,
                embedding: JSON.stringify(embedding), // Ensure DB handles this, vector type usually auto-casts but JSON.stringify is safe for client libs often
                metadata: {
                    tags: tags || [],
                    source: source || 'api_upload',
                    ingest_date: new Date().toISOString(),
                    chunk_index: chunks.indexOf(chunkContent),
                    total_chunks: chunks.length,
                    original_length: content.length
                }
            }).select()

            if (error) {
                console.error('Supabase Insert Error:', error);
                throw new Error(error.message);
            }
            results.push(data);
        }

        return NextResponse.json({ success: true, chunks_processed: results.length })

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error('Ingest API Error:', message)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
