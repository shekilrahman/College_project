import { Outlet, createRootRoute, useMatchRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { MinimalTitlebar } from '@/components/layout/MinimalTitlebar'

export const Route = createRootRoute({
    component: RootComponent,
})

function RootComponent() {
    const matchRoute = useMatchRoute()

    const isDashboard = !!matchRoute({ to: '/dashboard', fuzzy: true })
    const isProjectDetail = !!matchRoute({ to: '/dashboard/projects/$projectId', fuzzy: true })

    const showDashboardLayout = isDashboard || isProjectDetail

    if (showDashboardLayout) {
        return (
            <DashboardLayout hideSidebar={isProjectDetail}>
                <Outlet />
                <TanStackRouterDevtools position="bottom-right" />
            </DashboardLayout>
        )
    }

    return (
        <div className="min-h-screen bg-background font-sans antialiased flex flex-col">
            <MinimalTitlebar />
            <div className="flex-1 w-full flex flex-col">
                <div className="w-full flex-1 flex flex-col py-6 px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                    <Outlet />
                </div>
            </div>
            <TanStackRouterDevtools position="bottom-right" />
        </div>
    )
}
