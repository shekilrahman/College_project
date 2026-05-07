import { ReactNode } from 'react'
import { DashboardSidebar } from './DashboardSidebar'
import { GlobalHeader } from './GlobalHeader'

interface DashboardLayoutProps {
    children: ReactNode
    hideSidebar?: boolean
}

export function DashboardLayout({ children, hideSidebar = false }: DashboardLayoutProps) {
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background">
            <GlobalHeader />
            <div className="flex flex-1 overflow-hidden relative">
                {!hideSidebar && <DashboardSidebar />}
                <main className={`flex-1 overflow-y-auto ${hideSidebar ? 'pl-0' : 'pl-[68px]'} bg-slate-50/30`}>
                    <div className={`${hideSidebar ? 'p-0' : 'px-5 py-10'}`}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
