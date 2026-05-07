import { useState, useCallback, memo } from 'react'
import { Link, useMatchRoute } from '@tanstack/react-router'
import {
    LayoutDashboard,
    Users,
    User,
    CheckSquare,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'

interface NavItem {
    label: string
    icon: React.ReactNode
    to: string
    adminOnly?: boolean
}

export const DashboardSidebar = memo(function DashboardSidebar() {
    const [expanded, setExpanded] = useState(false)
    const { user } = useAuth()
    const matchRoute = useMatchRoute()

    if (!user) return null

    const navItems: NavItem[] = [
        {
            label: 'Projects',
            icon: <LayoutDashboard className="h-5 w-5" />,
            to: '/dashboard',
        },
        {
            label: 'Tasks',
            icon: <CheckSquare className="h-5 w-5" />,
            to: '/dashboard/tasks',
        },
        {
            label: 'Team',
            icon: <Users className="h-5 w-5" />,
            to: '/dashboard/users',
            adminOnly: true,
        },
        {
            label: 'Profile',
            icon: <User className="h-5 w-5" />,
            to: '/dashboard/profile',
        },
    ]

    const filteredNav = navItems.filter(
        (item) => !item.adminOnly || user.type === 'admin'
    )

    const isActive = (to: string) => {
        if (to === '/dashboard') {
            return !!matchRoute({ to: '/dashboard', fuzzy: false })
        }
        return !!matchRoute({ to, fuzzy: true })
    }

    const handleMouseEnter = useCallback(() => setExpanded(true), [])
    const handleMouseLeave = useCallback(() => setExpanded(false), [])

    return (
        <TooltipProvider delayDuration={0}>
            <aside
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className={`sidebar-root group/sidebar absolute left-0 top-0 flex flex-col h-full bg-white border-r border-slate-200/80 transition-all duration-200 ease-in-out z-40 ${expanded ? 'w-[240px] shadow-2xl shadow-slate-900/10' : 'w-[68px]'
                    }`}
            >
                {/* Navigation */}
                <nav className="flex-1 flex flex-col gap-1 px-3 py-4 overflow-y-auto sidebar-scrollbar-light">
                    {filteredNav.map((item) => {
                        const active = isActive(item.to)
                        const linkEl = (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={`relative flex items-center gap-3 rounded-xl transition-all duration-200 group/item ${expanded
                                        ? 'px-3 h-11'
                                        : 'justify-center h-11 w-11 mx-auto'
                                    } ${active
                                        ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                            >
                                {active && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-indigo-400 to-purple-500" />
                                )}
                                <span className={`shrink-0 transition-transform duration-200 ${active ? 'text-indigo-600' : ''} group-hover/item:scale-110`}>
                                    {item.icon}
                                </span>
                                {expanded && (
                                    <span className="text-sm font-medium truncate animate-in fade-in slide-in-from-left-1 duration-150">
                                        {item.label}
                                    </span>
                                )}
                            </Link>
                        )

                        if (!expanded) {
                            return (
                                <Tooltip key={item.to}>
                                    <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                                    <TooltipContent side="right" className="font-medium">
                                        {item.label}
                                    </TooltipContent>
                                </Tooltip>
                            )
                        }

                        return linkEl
                    })}
                </nav>
            </aside>
        </TooltipProvider>
    )
})
