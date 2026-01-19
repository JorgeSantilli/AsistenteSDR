'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Home,
    LayoutDashboard,
    Phone,
    Briefcase,
    BarChart2,
    Settings,
    HelpCircle,
    LogOut,
    Mic,
    Database
} from 'lucide-react'

const MENU_ITEMS = [
    { icon: Home, label: 'Inicio', path: '/dashboard' },
    { icon: Briefcase, label: 'Pipeline', path: '/dashboard/pipeline' },
    { icon: Phone, label: 'Llamadas', path: '/dashboard/calls' },
    { icon: Mic, label: 'Asistente Live', path: '/dashboard/assistant' }, // Specific feature
    { icon: Database, label: 'Base de Conocimiento', path: '/dashboard/knowledge' },
    { icon: BarChart2, label: 'Reportes', path: '/dashboard/reports' },
]

export default function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="w-16 lg:w-64 h-screen bg-[#1e1b4b] text-white flex flex-col shrink-0 transition-all duration-300">
            {/* Brand */}
            <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-indigo-900/50">
                <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-lg">A</span>
                </div>
                <span className="ml-3 font-bold text-xl hidden lg:block">AsistenteSDR</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 space-y-1 px-3">
                {MENU_ITEMS.map((item) => {
                    const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path))
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            title={item.label}
                            className={`flex items-center px-3 py-3 rounded-xl transition-all group ${isActive
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
                                : 'text-indigo-200 hover:bg-indigo-900/50 hover:text-white'
                                }`}
                        >
                            <item.icon size={22} className={`${isActive ? 'text-white' : 'text-indigo-300 group-hover:text-white'}`} />
                            <span className="ml-3 font-medium hidden lg:block">{item.label}</span>
                            {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white hidden lg:block" />}
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-indigo-900/50 space-y-2">
                <button className="flex items-center justify-center lg:justify-start w-full px-3 py-2 text-indigo-300 hover:text-white hover:bg-indigo-900/50 rounded-lg transition-colors">
                    <Settings size={20} />
                    <span className="ml-3 text-sm hidden lg:block">Configuración</span>
                </button>
                <button className="flex items-center justify-center lg:justify-start w-full px-3 py-2 text-indigo-300 hover:text-white hover:bg-indigo-900/50 rounded-lg transition-colors">
                    <HelpCircle size={20} />
                    <span className="ml-3 text-sm hidden lg:block">Ayuda</span>
                </button>
            </div>

            {/* User Profile Mini */}
            <div className="p-4 bg-indigo-950/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold border-2 border-indigo-400">
                        JS
                    </div>
                    <div className="hidden lg:block overflow-hidden">
                        <p className="text-sm font-medium truncate">Jorge Santilli</p>
                        <p className="text-xs text-indigo-300 truncate">SDR Lead</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
