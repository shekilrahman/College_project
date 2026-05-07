import { useAuth } from '@/context/AuthContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LogOut, Bell, Minus, Square, X, User, FolderKanban } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function GlobalHeader() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    if (!user) return null

    const roleLabel =
        user.type === 'admin' ? 'Admin'
        : user.type === 'pm' ? 'Manager'
        : user.type === 'dev' ? 'Developer'
        : user.type === 'intern' ? 'Intern'
        : 'User'

    const roleColor =
        user.type === 'admin' ? 'bg-blue-500/15 text-blue-600 border-blue-500/25'
        : user.type === 'pm' ? 'bg-amber-500/15 text-amber-600 border-amber-500/25'
        : user.type === 'dev' ? 'bg-indigo-500/15 text-indigo-600 border-indigo-500/25'
        : 'bg-slate-500/15 text-slate-600 border-slate-500/25'

    const handleWindowMinimize = async () => {
        try {
            const { getCurrentWindow } = await import('@tauri-apps/api/window')
            getCurrentWindow().minimize()
        } catch { /* running in browser */ }
    }

    const handleWindowMaximize = async () => {
        try {
            const { getCurrentWindow } = await import('@tauri-apps/api/window')
            getCurrentWindow().toggleMaximize()
        } catch { /* running in browser */ }
    }

    const handleWindowClose = async () => {
        try {
            const { getCurrentWindow } = await import('@tauri-apps/api/window')
            getCurrentWindow().close()
        } catch { /* running in browser */ }
    }

    const handleDragStart = async (e: React.MouseEvent) => {
        // Prevent drag when clicking on interactive elements
        if ((e.target as HTMLElement).closest('button, [role="menu"], [data-no-drag]')) return
        try {
            const { getCurrentWindow } = await import('@tauri-apps/api/window')
            getCurrentWindow().startDragging()
        } catch { /* running in browser */ }
    }

    return (
        <header
            onMouseDown={handleDragStart}
            className="sticky top-0 z-20 h-12 bg-background/80 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-4 shrink-0 select-none"
        >
            {/* Left Brand Area */}
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 shrink-0">
                    <FolderKanban className="h-4.5 w-4.5 text-white" />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900 tracking-tight leading-tight">
                        ProMan
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium tracking-wider uppercase">
                        Project Manager
                    </span>
                </div>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-1.5" data-no-drag>
                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
                    <Bell className="h-4 w-4" />
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-background" />
                </Button>

                {/* Profile Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-accent/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30">
                            <div className="relative">
                                {user.profilePhoto ? (
                                    <img 
                                        src={user.profilePhoto} 
                                        alt={user.name} 
                                        className="h-7 w-7 rounded-lg object-cover shadow-sm ring-1 ring-border/50"
                                    />
                                ) : (
                                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-[1.5px] border-background" />
                            </div>
                            <span className="text-sm font-medium hidden sm:inline">{user.name}</span>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 p-3 rounded-[1.25rem] border-slate-100 shadow-2xl">
                        <DropdownMenuLabel className="p-3">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-100 shadow-inner overflow-hidden shrink-0">
                                    {user.profilePhoto ? (
                                        <img 
                                            src={user.profilePhoto} 
                                            alt={user.name} 
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-full w-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg font-black text-white">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <p className="text-sm font-black text-slate-900 truncate tracking-tight">{user.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 truncate tracking-tight">{user.email}</p>
                                    <Badge variant="outline" className={`w-fit mt-1 text-[8px] tracking-widest uppercase px-2 py-0 h-4 border-2 font-black ${roleColor}`}>
                                        {roleLabel}
                                    </Badge>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate({ to: '/dashboard/profile' })} className="cursor-pointer">
                            <User className="mr-2 h-4 w-4" />
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Window control divider */}
                <div className="h-5 w-px bg-border/60 mx-1" />

                {/* Window Controls */}
                <Button variant="ghost" size="icon" onClick={handleWindowMinimize} className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60">
                    <Minus className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleWindowMaximize} className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60">
                    <Square className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleWindowClose} className="h-7 w-7 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10">
                    <X className="h-3.5 w-3.5" />
                </Button>
            </div>
        </header>
    )
}
