import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
    try {
        const { interaction_id } = await req.json()
        if (!interaction_id) return NextResponse.json({ error: 'Missing interaction_id' }, { status: 400 })

        const supabase = await createClient() // Server client with auth context

        // 1. Get Interaction
        const { data: interaction, error: intError } = await supabase
            .from('interactions')
            .select('*')
            .eq('id', interaction_id)
            .single()

        if (intError || !interaction) throw new Error('Interaction not found')

        // 2. Analyze with OpenAI (Extract Learning Data)
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are an expert sales trainer. Analyze the following transcript. Identify ONE or TWO key objection handling moments where the SDR performed well. Output them as a purely JSON array of objects with 'question' (the objection) and 'answer' (the refined response) keys. Do NOT output markdown code blocks, just the JSON array."
                },
                {
                    role: "user",
                    content: `Transcript:\n\n${interaction.transcript_full}`
                }
            ],
            temperature: 0.3
        })

        const content = completion.choices[0].message.content
        let insights = []
        try {
            // Cleanup potential markdown fences
            const jsonStr = content?.replace(/```json/g, '').replace(/```/g, '') || '[]'
            insights = JSON.parse(jsonStr)
        } catch (e) {
            console.error("Failed to parse LLM output", content)
            return NextResponse.json({ error: 'Failed to analyze transcript' }, { status: 500 })
        }

        // 3. Embed and Insert
        const learningResults = []
        for (const insight of insights) {
            const kbContent = `Objection: ${insight.question}\nBest Practice Response: ${insight.answer}`

            const embeddingResponse = await openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: kbContent,
            })
            const embedding = embeddingResponse.data[0].embedding

            const { data: kbData, error: kbError } = await supabase.from('knowledge_base').insert({
                organization_id: interaction.organization_id,
                content: kbContent,
                embedding: embedding as any,
                metadata: {
                    source: 'dynamic_learning',
                    trigger: 'success_feedback',
                    origin_interaction: interaction.id
                }
            }).select()

            if (!kbError && kbData) learningResults.push(kbData[0])
        }

        return NextResponse.json({ success: true, learned_items: learningResults })

    } catch (error: any) {
        console.error("Feedback Loop Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
