'use client'

import { Search, Bell, Plus } from 'lucide-react'

export default function Header({
    title = 'Dashboard',
    onNewClick
}: {
    title?: string,
    onNewClick?: () => void
}) {
    return (
        <header className="h-20 bg-white border-b border-zinc-200 flex items-center justify-between px-8 sticky top-0 z-20">

            {/* Left: Title & Breadcrumbs */}
            <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-zinc-900">{title}</h1>
                <div className="h-6 w-px bg-zinc-300 mx-2 hidden md:block" />
                <button className="hidden md:flex items-center gap-2 text-sm text-zinc-600 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-full transition-colors">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Equipo de Jorge
                </button>
            </div>

            {/* Center: Search (Optional) */}
            <div className="hidden lg:flex flex-1 max-w-xl mx-12">
                <div className="relative w-full group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar cuentas, personas, oportunidades..."
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    />
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
                <button className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-full transition-colors relative">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                </button>

                <div className="h-8 w-px bg-zinc-200 mx-2" />

                <button
                    onClick={onNewClick}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-sm active:scale-95"
                >
                    <Plus size={18} />
                    <span className="hidden sm:block">Nueva Oportunidad</span>
                </button>
            </div>
        </header>
    )
}
