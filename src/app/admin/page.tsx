import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { switchOrganization } from '@/app/actions/admin'

export default async function AdminDashboard() {
    const supabase = await createClient()

    // 1. Verify Super Admin Access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'super_admin') {
        redirect('/dashboard')
    }

    // 2. Fetch Metrics
    const { count: orgCount } = await supabase.from('organizations').select('*', { count: 'exact', head: true })
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    const { count: interactionCount } = await supabase.from('interactions').select('*', { count: 'exact', head: true })
    const { count: dealCount } = await supabase.from('deals').select('*', { count: 'exact', head: true })

    // 3. Fetch Organizations
    const { data: orgs } = await supabase
        .from('organizations')
        .select(`
      id,
      name,
      created_at,
      profiles (count)
    `)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6 p-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Super Admin Panel</h1>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard title="Total Organizations" value={orgCount || 0} icon="🏢" />
                <MetricCard title="Total Users" value={userCount || 0} icon="👥" />
                <MetricCard title="Total Interactions" value={interactionCount || 0} icon="💬" />
                <MetricCard title="Total Deals" value={dealCount || 0} icon="💰" />
            </div>

            {/* Organizations Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">Organizations</h2>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {orgs?.map((org: any) => (
                            <tr key={org.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{org.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(org.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {org.profiles[0]?.count || 0}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <form action={switchOrganization.bind(null, org.id)}>
                                        <button
                                            type="submit"
                                            className="text-indigo-600 hover:text-indigo-900 font-semibold"
                                        >
                                            Access Dashboard &rarr;
                                        </button>
                                    </form>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function MetricCard({ title, value, icon }: { title: string, value: number, icon: string }) {
    return (
        <div className="bg-white p-6 rounded-lg shadow flex items-center space-x-4">
            <div className="text-4xl">{icon}</div>
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    )
}
