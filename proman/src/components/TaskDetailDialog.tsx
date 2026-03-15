import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, User, Clock, Flag, AlignLeft, Plus, BarChart, Layers, TrendingUp, FolderOpen, History, Minus, FileText, Link } from 'lucide-react';
import { format } from 'date-fns';

import { Task } from '@/api/types';
import { updateTaskProgress } from '@/api/tasks';
import { Lock } from 'lucide-react';


interface TaskDetailDialogProps {
    task: Task | null;
    parentTaskTitle?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAddSubtask?: (taskId: string) => void;
    isLeafTask?: boolean;
    canUpdateProgress?: boolean;
    onTaskUpdated?: () => void;
}

export function TaskDetailDialog({ task, parentTaskTitle, open, onOpenChange, onAddSubtask, isLeafTask = false, canUpdateProgress = false, onTaskUpdated }: TaskDetailDialogProps) {
    const [progressAmount, setProgressAmount] = useState('10');
    const [progressNote, setProgressNote] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    if (!task) return null;

    const priorityColors = {
        High: 'bg-red-500',
        Medium: 'bg-yellow-500',
        Low: 'bg-blue-500'
    };

    const statusColors = {
        'Pending': 'bg-slate-100 text-slate-700 border-slate-300',
        'In Progress': 'bg-blue-100 text-blue-700 border-blue-300',
        'Completed': 'bg-green-100 text-green-700 border-green-300'
    };

    const handleProgressUpdate = async (isPositive: boolean) => {
        if (!task) return;
        setIsUpdating(true);
        try {
            const amount = isPositive ? `+${progressAmount}` : `-${progressAmount}`;
            await updateTaskProgress(task._id, { amount, note: progressNote || undefined });
            setProgressNote('');
            if (onTaskUpdated) onTaskUpdated();
        } catch (error) {
            console.error('Failed to update progress:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    // Check if task is locked by dependencies
    const incompleteDependencies = (task.dependencies as Task[])?.filter?.(dep => typeof dep === 'object' && dep.status !== 'Completed') || [];
    const isLocked = incompleteDependencies.length > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-3 pb-4 border-b">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                            <DialogTitle className="text-2xl font-bold leading-tight pr-8">
                                {task.title}
                            </DialogTitle>
                            <div className="flex items-center gap-2 flex-wrap">
                                <Badge
                                    variant="outline"
                                    className={`capitalize font-medium ${statusColors[task.status as keyof typeof statusColors] || 'bg-slate-100 text-slate-700'}`}
                                >
                                    {task.status}
                                </Badge>
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 border">
                                    <div className={`h-2 w-2 rounded-full ${priorityColors[task.priority as keyof typeof priorityColors] || 'bg-gray-500'}`} />
                                    <span className="text-xs font-semibold">{task.priority} Priority</span>
                                </div>
                                {isLeafTask && (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                                        Leaf Task
                                    </Badge>
                                )}
                                {isLocked && (
                                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 gap-1">
                                        <Lock className="h-3 w-3" /> Locked
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="details" className="gap-2">
                            <FileText className="h-4 w-4" />
                            Details
                        </TabsTrigger>
                        <TabsTrigger
                            value="progress"
                            className="gap-2"
                            disabled={!isLeafTask || !canUpdateProgress || isLocked}
                            title={isLocked ? "Cannot update progress until dependencies are completed" : ""}
                        >
                            <TrendingUp className="h-4 w-4" />
                            Progress
                            {isLocked && <Lock className="h-3 w-3 ml-1 text-red-500" />}
                        </TabsTrigger>
                    </TabsList>

                    {/* Details Tab */}
                    <TabsContent value="details" className="space-y-6">
                        {/* Description Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-bold text-foreground uppercase tracking-wide">
                                <AlignLeft className="h-4 w-4 text-primary" />
                                Description
                            </div>
                            <div className="text-sm leading-relaxed text-foreground/80 bg-muted/40 p-4 rounded-lg border border-border/50">
                                {task.description || 'No description provided.'}
                            </div>
                        </div>

                        {/* Progress & Metrics Section */}
                        <div className="grid grid-cols-3 gap-4">
                            {/* Progress */}
                            <div className="space-y-2 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                                <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                                    <TrendingUp className="h-3.5 w-3.5" />
                                    Progress
                                </div>
                                <div className="space-y-2">
                                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                        {task.progress || 0}%
                                    </div>
                                    <div className="w-full bg-blue-200/50 dark:bg-blue-900/30 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${task.progress || 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Weight */}
                            <div className="space-y-2 p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border border-purple-200/50 dark:border-purple-800/50">
                                <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide">
                                    <BarChart className="h-3.5 w-3.5" />
                                    Weight
                                </div>
                                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                                    {task.weight || 0}
                                </div>
                                <div className="text-xs text-purple-600/70 dark:text-purple-400/70">
                                    Affects parent progress
                                </div>
                            </div>

                            {/* Level */}
                            <div className="space-y-2 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-lg border border-emerald-200/50 dark:border-emerald-800/50">
                                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                                    <Layers className="h-3.5 w-3.5" />
                                    Level
                                </div>
                                <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                                    {task.level || 0}
                                </div>
                                <div className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                                    Hierarchy depth
                                </div>
                            </div>
                        </div>

                        {/* Task Details Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Assignee */}
                            <div className="space-y-2 p-3 bg-muted/30 rounded-lg border">
                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                                    <User className="h-3.5 w-3.5" />
                                    Assigned To
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                                        <span className="text-xs font-bold text-primary">
                                            {(typeof task.assignedTo !== 'string' && task.assignedTo?.name?.charAt(0).toUpperCase()) || '?'}
                                        </span>
                                    </div>
                                    <span className="text-sm font-semibold">
                                        {(typeof task.assignedTo !== 'string' && task.assignedTo?.name) || 'Unassigned'}
                                    </span>
                                </div>
                            </div>

                            {/* Creator */}
                            <div className="space-y-2 p-3 bg-muted/30 rounded-lg border">
                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                                    <User className="h-3.5 w-3.5" />
                                    Created By
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                                        <span className="text-xs font-bold text-secondary-foreground">
                                            {(typeof task.createdBy !== 'string' && task.createdBy?.name?.charAt(0).toUpperCase()) || '?'}
                                        </span>
                                    </div>
                                    <span className="text-sm font-semibold">
                                        {(typeof task.createdBy !== 'string' && task.createdBy?.name) || 'Unknown'}
                                    </span>
                                </div>
                            </div>

                            {/* Due Date */}
                            <div className="space-y-2 p-3 bg-muted/30 rounded-lg border">
                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Due Date
                                </div>
                                <div className="text-sm font-semibold">
                                    {task.dates?.toCompleteDate ? format(new Date(task.dates.toCompleteDate), 'PPP') : 'No due date'}
                                </div>
                            </div>

                            {/* Priority */}
                            <div className="space-y-2 p-3 bg-muted/30 rounded-lg border">
                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                                    <Flag className="h-3.5 w-3.5" />
                                    Priority Level
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`h-3 w-3 rounded-full ${priorityColors[task.priority as keyof typeof priorityColors] || 'bg-gray-500'}`} />
                                    <span className="text-sm font-semibold">{task.priority}</span>
                                </div>
                            </div>

                            {/* Project */}
                            {task.project && (
                                <div className="space-y-2 p-3 bg-muted/30 rounded-lg border col-span-2">
                                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                                        <FolderOpen className="h-3.5 w-3.5" />
                                        Project
                                    </div>
                                    <div className="text-sm font-semibold">
                                        {typeof task.project !== 'string' ? task.project.title : 'Unknown Project'}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Parent Task */}
                        {parentTaskTitle && (
                            <div className="space-y-2 p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
                                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                                    <Layers className="h-3.5 w-3.5" />
                                    Parent Task
                                </div>
                                <div className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                                    {parentTaskTitle}
                                </div>
                            </div>
                        )}

                        {/* Dependencies Section */}
                        {task.dependencies && task.dependencies.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-bold text-foreground uppercase tracking-wide">
                                    <Link className="h-4 w-4 text-primary" />
                                    Dependencies
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {(task.dependencies as any[]).map((dep) => {
                                        // Handle both populated objects and unpopulated string arrays gracefully
                                        const isPopulated = typeof dep === 'object' && dep !== null;
                                        const title = isPopulated ? dep.title : `Task ID: ${dep}`;
                                        const status = isPopulated ? dep.status : 'Unknown';

                                        const depStatusColors = {
                                            'Pending': 'text-slate-600 bg-slate-100 border-slate-200',
                                            'In Progress': 'text-blue-600 bg-blue-100 border-blue-200',
                                            'Completed': 'text-emerald-700 bg-emerald-100 border-emerald-200'
                                        };

                                        return (
                                            <div key={isPopulated ? dep._id : dep} className="flex items-center justify-between p-3 rounded-md border bg-card shadow-sm">
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="text-sm font-semibold truncate">{title}</span>
                                                </div>
                                                <Badge variant="outline" className={`ml-2 whitespace-nowrap ${depStatusColors[status as keyof typeof depStatusColors] || ''}`}>
                                                    {status}
                                                </Badge>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Timestamps */}
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                                    <Clock className="h-3 w-3" />
                                    Created At
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {task.createdAt ? format(new Date(task.createdAt), 'PPp') : 'N/A'}
                                </div>
                            </div>

                            {task.dates?.startedDate && (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                                        <Clock className="h-3 w-3" />
                                        Started At
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {format(new Date(task.dates.startedDate), 'PPp')}
                                    </div>
                                </div>
                            )}

                            {task.dates?.completedDate && (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                                        <Clock className="h-3 w-3" />
                                        Completed At
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {format(new Date(task.dates.completedDate), 'PPp')}
                                    </div>
                                </div>
                            )}

                            {task.updatedAt && (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                                        <Clock className="h-3 w-3" />
                                        Last Updated
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {format(new Date(task.updatedAt), 'PPp')}
                                    </div>
                                </div>
                            )}
                        </div>

                        {onAddSubtask && (
                            <div className="pt-4 flex justify-end border-t">
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => {
                                        if (task) onAddSubtask(task._id);
                                        onOpenChange(false);
                                    }}
                                    className="gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Subtask
                                </Button>
                            </div>
                        )}
                    </TabsContent>

                    {/* Progress Tab */}
                    <TabsContent value="progress" className="space-y-6">
                        {/* Current Progress Display */}
                        <div className="space-y-4 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                                    <TrendingUp className="h-4 w-4" />
                                    Current Progress
                                </div>
                                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                                    {task.progress || 0}%
                                </div>
                            </div>
                            <div className="w-full bg-blue-200/50 dark:bg-blue-900/30 rounded-full h-4">
                                <div
                                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-4 rounded-full transition-all duration-500"
                                    style={{ width: `${task.progress || 0}%` }}
                                />
                            </div>
                        </div>

                        {/* Progress Update Controls */}
                        <div className="space-y-4 p-6 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-xl border border-orange-200/50 dark:border-orange-800/50">
                            <div className="flex items-center gap-2 text-sm font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wide">
                                <BarChart className="h-4 w-4" />
                                Update Progress
                            </div>
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-center gap-4">
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        onClick={() => handleProgressUpdate(false)}
                                        disabled={isUpdating}
                                        className="bg-red-50 hover:bg-red-100 border-red-200 text-red-700 h-14 w-14"
                                    >
                                        <Minus className="h-6 w-6" />
                                    </Button>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            value={progressAmount}
                                            onChange={(e) => setProgressAmount(e.target.value)}
                                            className="w-24 text-center font-bold text-xl h-14"
                                            min="1"
                                            max="100"
                                        />
                                        <span className="text-xl font-bold text-muted-foreground">%</span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        onClick={() => handleProgressUpdate(true)}
                                        disabled={isUpdating}
                                        className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700 h-14 w-14"
                                    >
                                        <Plus className="h-6 w-6" />
                                    </Button>
                                </div>
                                <Input
                                    placeholder="Add a note for this update (optional)"
                                    value={progressNote}
                                    onChange={(e) => setProgressNote(e.target.value)}
                                    className="text-sm"
                                />
                            </div>
                        </div>

                        {/* Progress History */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-bold text-foreground uppercase tracking-wide">
                                <History className="h-4 w-4 text-primary" />
                                Progress History
                            </div>
                            {task.progressHistory && task.progressHistory.length > 0 ? (
                                <div className="max-h-64 overflow-y-auto space-y-2 p-3 bg-muted/30 rounded-lg border">
                                    {task.progressHistory.slice().reverse().map((entry, idx) => (
                                        <div key={idx} className="flex items-start gap-3 p-3 bg-background rounded-lg border text-sm hover:shadow-sm transition-shadow">
                                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-sm font-bold text-blue-700 border border-blue-200">
                                                {entry.progress}%
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs text-muted-foreground mb-1">
                                                    {format(new Date(entry.timestamp), 'PPp')}
                                                </div>
                                                {entry.note ? (
                                                    <div className="text-sm font-medium">{entry.note}</div>
                                                ) : (
                                                    <div className="text-sm text-muted-foreground italic">No note</div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                                    No progress updates yet. Use the controls above to record your first update.
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
