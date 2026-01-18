import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Database } from '@/lib/database.types'

// Note: Using Service Role Key here might be safer for "system" level updates if we bypass RLS,
// but for now we stick to Anon key assuming public policies or authenticated user.
// In a real scenario, this endpoint should be protected by Authentication Middleware.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { interaction_id, status, full_transcript, organization_id } = body

        if (!full_transcript || !organization_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 1. Log the Interaction
        const { data, error } = await supabase
            .from('interactions')
            .insert({
                organization_id,
                transcript_full: full_transcript,
                status: status || 'NEUTRAL', // SUCCESS, FAILURE, NEUTRAL
                // id field is auto-generated usually, but if interaction_id provided we can use it?
                // Let's rely on DB generation or use provided UUID if linking sessions.
                ...(interaction_id ? { id: interaction_id } : {})
            })
            .select()

        if (error) {
            console.error("Supabase Write Error:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, id: data[0].id })

    } catch (error) {
        console.error("API Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
