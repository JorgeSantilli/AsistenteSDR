'use server'

import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

/**
 * Server Action to switch the current user's organization context.
 * Used by Super Admins to access different organization dashboards.
 */
export async function switchOrganization(organizationId: string) {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // Verify super admin status
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'super_admin') {
        redirect('/dashboard')
    }

    // Update user's organization_id in profile
    await supabase
        .from('profiles')
        .update({ organization_id: organizationId })
        .eq('id', user.id)

    redirect('/dashboard')
}
