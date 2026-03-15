import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { LayoutDashboard, Users, LogOut, Settings, Command } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

export function NavigationLauncher() {
    const [open, setOpen] = useState(false)
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Toggle on Ctrl+Space press
            if (e.ctrlKey && e.code === 'Space') {
                e.preventDefault()
                setOpen((prev) => !prev)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    if (!user) return null

    const handleLogout = () => {
        setOpen(false)
        logout()
    }

    const navigateTo = (path: string) => {
        setOpen(false)
        navigate({ to: path })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[800px] bg-background/80 backdrop-blur-3xl border-none shadow-2xl p-0 overflow-hidden gap-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-2xl font-light tracking-tight text-center flex items-center justify-center gap-2">
                        <Command className="h-6 w-6 text-primary" />
                        <span>Navigation</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Dashboard Card */}
                    <button
                        onClick={() => navigateTo('/dashboard')}
                        className="group relative flex flex-col items-center justify-center p-8 space-y-4 rounded-2xl bg-card border border-border/50 hover:bg-accent/50 hover:border-primary/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                        <div className="p-4 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
                            <LayoutDashboard className="h-10 w-10" />
                        </div>
                        <div className="text-center space-y-1">
                            <h3 className="font-semibold text-lg">Dashboard</h3>
                            <p className="text-sm text-muted-foreground">Manage projects and tasks</p>
                        </div>
                    </button>

                    {/* Users Card (Admin Only) */}
                    {user.type === 'admin' && (
                        <button
                            onClick={() => navigateTo('/dashboard/users')}
                            className="group relative flex flex-col items-center justify-center p-8 space-y-4 rounded-2xl bg-card border border-border/50 hover:bg-accent/50 hover:border-primary/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            <div className="p-4 rounded-full bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform duration-300">
                                <Users className="h-10 w-10" />
                            </div>
                            <div className="text-center space-y-1">
                                <h3 className="font-semibold text-lg">User Management</h3>
                                <p className="text-sm text-muted-foreground">Administer roles and accounts</p>
                            </div>
                        </button>
                    )}

                    {/* Profile/Settings Card */}
                    <button
                        disabled // Placeholder functionality
                        className="group relative flex flex-col items-center justify-center p-8 space-y-4 rounded-2xl bg-card border border-border/50 hover:bg-accent/50 hover:border-primary/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 opacity-50 cursor-not-allowed"
                    >
                        <div className="p-4 rounded-full bg-orange-500/10 text-orange-500 group-hover:scale-110 transition-transform duration-300">
                            <Settings className="h-10 w-10" />
                        </div>
                        <div className="text-center space-y-1">
                            <h3 className="font-semibold text-lg">Settings</h3>
                            <p className="text-sm text-muted-foreground">My account preferences</p>
                        </div>
                    </button>

                    {/* Logout Card */}
                    <button
                        onClick={handleLogout}
                        className="group relative flex flex-col items-center justify-center p-8 space-y-4 rounded-2xl bg-destructive/5 border border-destructive/20 hover:bg-destructive/10 hover:border-destructive/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-destructive/50"
                    >
                        <div className="p-4 rounded-full bg-destructive/10 text-destructive group-hover:scale-110 transition-transform duration-300">
                            <LogOut className="h-10 w-10" />
                        </div>
                        <div className="text-center space-y-1">
                            <h3 className="font-semibold text-lg text-destructive">Sign Out</h3>
                            <p className="text-sm text-muted-foreground">End your session</p>
                        </div>
                    </button>
                </div>

                <div className="p-4 bg-muted/20 text-center">
                    <p className="text-xs text-muted-foreground">
                        Press <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100"><span className="text-xs">CTRL + SPACE</span></kbd> to toggle this menu anytime
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}
