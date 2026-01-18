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
        const contextText = documents?.map((d: any) => d.content).join("\n---\n") || ""

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are an expert Sales Development Representative assistant. 
          Your goal is to help the user handle objections and steer the conversation to a meeting booking.
          Use the following CONTEXT from the company's knowledge base to answer. 
          If the context doesn't help, use general best practices but prioritize the context.
          
          CONTEXT:
          ${contextText}`
                },
                { role: "user", content: `Prospect says: "${transcript}"` }
            ],
            temperature: 0.6,
        })

        const suggestion = completion.choices[0].message.content

        return NextResponse.json({
            suggestion,
            context_used: documents?.map((d: any) => ({ content: d.content, metadata: d.metadata }))
        })

    } catch (error) {
        console.error("API Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
