import { createClient } from '@supabase/supabase-js'
import { OpenAI } from 'openai'
import { NextResponse } from 'next/server'
import { Database } from '@/lib/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const openaiKey = process.env.OPENAI_API_KEY

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
const openai = new OpenAI({ apiKey: openaiKey })

const SEED_DATA = [
    {
        content: "If a prospect says 'It's too expensive', respond with: 'I understand budget is a concern. However, most of our customers see a 3x ROI within the first month by automating lead qualification. Can we look at your current cost of manual SDR work?'",
        tags: ["objection", "pricing", "roi"]
    },
    {
        content: "Our main competitor 'SalesForceMax' lacks real-time voice analysis. Unlike them, we provide live objection handling during the call, not just post-call analytics. This increases conversion rates by 25%.",
        tags: ["competitor", "differentiation", "tech"]
    },
    {
        content: "Value Proposition: We automate the tedious parts of being an SDR. Our AI listens, takes notes, and suggests answers, allowing you to focus on building a relationship with the buyer.",
        tags: ["value_prop", "pitch"]
    },
    {
        content: "If they ask about integration: 'Yes, we integrate natively with Salesforce, HubSpot, and Pipedrive. It takes 5 minutes to set up.'",
        tags: ["technical", "integration"]
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

        for (const item of SEED_DATA) {
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
