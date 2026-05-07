import { Button } from '@/components/ui/button'
import { Minus, Square, X } from 'lucide-react'

/** Minimal titlebar for auth pages (login/register) — just drag + window controls */
export function MinimalTitlebar() {
    const handleWindowMinimize = async () => {
        try {
            const { getCurrentWindow } = await import('@tauri-apps/api/window')
            getCurrentWindow().minimize()
        } catch { /* browser */ }
    }

    const handleWindowMaximize = async () => {
        try {
            const { getCurrentWindow } = await import('@tauri-apps/api/window')
            getCurrentWindow().toggleMaximize()
        } catch { /* browser */ }
    }

    const handleWindowClose = async () => {
        try {
            const { getCurrentWindow } = await import('@tauri-apps/api/window')
            getCurrentWindow().close()
        } catch { /* browser */ }
    }

    const handleDragStart = async (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) return
        try {
            const { getCurrentWindow } = await import('@tauri-apps/api/window')
            getCurrentWindow().startDragging()
        } catch { /* browser */ }
    }

    return (
        <div
            onMouseDown={handleDragStart}
            className="fixed top-0 left-0 right-0 z-50 h-10 flex items-center justify-end px-2 select-none"
        >
            <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="icon" onClick={handleWindowMinimize} className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10">
                    <Minus className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleWindowMaximize} className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10">
                    <Square className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleWindowClose} className="h-7 w-7 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10">
                    <X className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    )
}
