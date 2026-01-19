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

export async function POST(req: Request) {
    try {
        const { transcript, organization_id } = await req.json()

        if (!transcript || !organization_id) {
            return NextResponse.json({ error: 'Missing transcript or organization_id' }, { status: 400 })
        }

        // 1. Generate Embedding for the query (transcript chunk)
        const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: transcript,
        })

        const embedding = embeddingResponse.data[0].embedding

        // 2. Search in Supabase (Vector Search)
        // Note: 'match_documents' is an RPC function we need to create in Supabase
        // We will assume it exists for now as part of the architecture
        const { data: documents, error: searchError } = await supabase.rpc('match_documents', {
            query_embedding: embedding, // Pass as string if using pgvector-node or raw, but supabase-js usually handles array
            match_threshold: 0.7, // Similarity threshold
            match_count: 5,        // Number of chunks to retrieve
            filter: { organization_id: organization_id } // Critical RLS/Isolation
        })

        if (searchError) {
            console.error("Supabase Search Error:", searchError)
            return NextResponse.json({ error: searchError.message }, { status: 500 })
        }

        // 3. Generate "Assistant" Response (Objection Handling)
        // We feed the retrieved documents as context to the LLM
        const contextText = (documents as any[])?.map((d: any) => d.content).join("\n---\n") || ""

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are an elite Sales Engineer for Pxsol, an "all-in-one" hotel technology platform.
          
          YOUR GOAL: Provide a short, punchy, and winning response to the prospect's objection or query.
          
          GUIDELINES:
          1. USE THE CONTEXT: Strictly rely on the specific Pxsol features, integrations (Stripe, Payway, Turbosuite), and benefits (0% commissions) found in the CONTEXT below.
          2. BE CONCISE: The SDR is on a live call. Keep the suggestion under 2 sentences if possible.
          3. TONE: Professional, confident, and value-driven.
          4. FORMAT: Direct speech. Don't say "You should say...", just give the line.

          CONTEXT FROM KNOWLEDGE BASE:
          ${contextText}
          
          If the context is empty or irrelevant, fall back to general SaaS sales best practices but mention "our all-in-one platform".`
                },
                { role: "user", content: `Prospect says: "${transcript}"` }
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
