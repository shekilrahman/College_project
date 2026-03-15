import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { NavigationLauncher } from '@/components/layout/NavigationLauncher'

export const Route = createRootRoute({
    component: RootComponent,
})

function RootComponent() {
    return (
        <div className="min-h-screen bg-background font-sans antialiased flex flex-col">
            {/* Tab-triggered Navigation Modal */}
            <NavigationLauncher />

            {/* Main Content Area */}
            <div className="flex-1 w-full flex flex-col">
                {/* Top padding to prevent content from hitting the ceiling too hard since we lost the navbar */}
                <div className="w-full flex-1 flex flex-col py-6 px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                    <Outlet />
                </div>
            </div>

            <TanStackRouterDevtools position="bottom-right" />
        </div>
    )
}
