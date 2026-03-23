import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ViewModeNotchProps {
    projectTitle?: string;
    projectStatus?: string;
    creatorName?: string;
    creatorInitial?: string;
    onBack?: () => void;
}

export function ViewModeNotch({
    projectTitle,
    projectStatus,
    creatorName,
    creatorInitial,
    onBack
}: ViewModeNotchProps) {
    return (
        <div className="flex items-center gap-3 px-3 py-2 bg-white/90 backdrop-blur-md border border-white/30 shadow-lg rounded-2xl">
            {/* Back Button */}
            {onBack && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full"
                    onClick={onBack}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
            )}

            {/* Project Info */}
            {projectTitle && (
                <div className="flex items-center gap-2 pr-3 border-r border-slate-200">
                    <h1 className="text-sm font-bold text-slate-900 max-w-[200px] truncate">{projectTitle}</h1>
                    {projectStatus && (
                        <Badge
                            variant={projectStatus === 'Completed' ? 'default' : 'secondary'}
                            className="capitalize text-[10px] px-1.5 py-0"
                        >
                            {projectStatus}
                        </Badge>
                    )}
                </div>
            )}

            {/* Creator */}
            {creatorName && (
                <div className="flex items-center gap-1.5 pr-3 border-r border-slate-200">
                    <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 border border-indigo-200">
                        {creatorInitial || creatorName.charAt(0)}
                    </div>
                    <span className="text-xs font-medium text-slate-600 max-w-[100px] truncate">{creatorName}</span>
                </div>
            )}

        </div>
    );
}
