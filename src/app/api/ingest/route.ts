import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: Request) {
    try {
        const { content, tags, source } = await request.json()
        const supabase = await createClient()

        // 1. Get Org ID from session
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get Org (Prototype: First org found)
        const { data: orgs } = await supabase.from('organizations').select('id').limit(1)
        if (!orgs || orgs.length === 0) {
            return NextResponse.json({ error: 'No Organization Found' }, { status: 400 })
        }
        const orgId = orgs[0].id

        // 2. Generate Embedding
        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: content,
            encoding_format: "float",
        });

        const embedding = embeddingResponse.data[0].embedding;

        // 3. Store in Supabase
        const { data, error } = await supabase.from('knowledge_base').insert({
            organization_id: orgId,
            content: content,
            embedding: embedding as any,
            metadata: {
                tags: tags || [],
                source: source || 'api_upload',
                ingest_date: new Date().toISOString()
            }
        }).select()

        if (error) {
            console.error('Supabase Insert Error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, data })

    } catch (error: any) {
        console.error('Ingest API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
