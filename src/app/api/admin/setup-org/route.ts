import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Admin endpoint to setup user organization (bypasses RLS)
 * This uses the service_role key to avoid RLS policy recursion issues
 */
export async function POST(req: NextRequest) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({
                error: 'Missing Supabase configuration'
            }, { status: 500 })
        }

        // Create admin client (will use service role if available, otherwise anon)
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        const { userId, organizationName, fullName } = await req.json()

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
        }

        // 1. Check if user already has an organization
        const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('organization_id')
            .eq('id', userId)
            .single()

        if (existingProfile?.organization_id) {
            return NextResponse.json({
                success: true,
                message: 'User already has organization',
                organizationId: existingProfile.organization_id
            })
        }

        // 2. Find or create Organization
        let orgId: string
        const targetOrgName = organizationName || 'Pxsol Test'

        // Check if org exists ONLY if it's the default one (dev mode)
        // If it's a new custom org, we usually want to create it, but let's check name to match logic
        const { data: existingOrgs } = await supabaseAdmin
            .from('organizations')
            .select('id')
            .eq('name', targetOrgName)
            .limit(1)

        if (existingOrgs && existingOrgs.length > 0) {
            orgId = existingOrgs[0].id
        } else {
            const { data: newOrg, error: orgError } = await supabaseAdmin
                .from('organizations')
                .insert({ name: targetOrgName })
                .select()
                .single()

            if (orgError) throw orgError
            orgId = newOrg.id
        }

        // 3. Create/update profile with organization link
        const { error: upsertError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: userId,
                organization_id: orgId,
                full_name: fullName || 'Dev User'
            })

        if (upsertError) throw upsertError

        return NextResponse.json({
            success: true,
            organizationId: orgId,
            message: 'Organization linked successfully'
        })

    } catch (error: any) {
        console.error('Setup organization error:', error)
        return NextResponse.json({
            error: error.message || 'Failed to setup organization'
        }, { status: 500 })
    }
}
