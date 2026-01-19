'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import DevOrganizationLinker from '@/components/dashboard/DevOrganizationLinker'

/**
 * Root Dashboard Layout
 * 
 * Este layout envuelve todas las páginas del dashboard.
 * Incluimos aquí el DevOrganizationLinker para asegurar que el usuario
 * siempre tenga una organización configurada, sin importar a qué página entre primero.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <DashboardLayout>
            <div className="flex flex-col h-full">
                {/* 
                  Posicionamos el linker arriba del contenido. 
                  Solo se mostrará si hay un problema o está configurando.
                */}
                <div className="px-6 pt-4">
                    <DevOrganizationLinker />
                </div>
                {children}
            </div>
        </DashboardLayout>
    )
}
