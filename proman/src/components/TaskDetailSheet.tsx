import { useState } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, User, Clock, Flag, AlignLeft, Plus, BarChart, Layers, TrendingUp, FolderOpen, History, Minus, FileText, Link, Lock, Info, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

import { Task, Project } from '@/api/types';
import { updateTaskProgress } from '@/api/tasks';
import { UpdateTaskSheet } from './UpdateTaskSheet';
import { Separator } from '@/components/ui/separator';

interface TaskDetailSheetProps {
    task: Task | null;
    project: Project;
    allTasks?: Task[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAddSubtask?: (taskId: string) => void;
    isLeafTask?: boolean;
    canUpdateProgress?: boolean;
    onTaskUpdated?: () => void;
}

export function TaskDetailSheet({ task, project, allTasks = [], open, onOpenChange, onAddSubtask, isLeafTask = false, canUpdateProgress = false, onTaskUpdated }: TaskDetailSheetProps) {
    const [progressAmount, setProgressAmount] = useState('10');
    const [progressNote, setProgressNote] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    if (!task) return null;

    const subtasks = allTasks.filter(t => {
        const parentId = typeof t.parentTask === 'string' ? t.parentTask : t.parentTask?._id;
        return parentId === task._id;
    });

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

    const incompleteDependencies = (task.dependencies as Task[])?.filter?.(dep => {
        if (typeof dep !== 'object') return false;
        const isFinished = dep.status === 'Completed' || (dep.progress && dep.progress >= 100);
        return !isFinished;
    }) || [];
    const isLocked = incompleteDependencies.length > 0;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-none sm:w-[1000px] overflow-y-auto bg-white border-l p-0 flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    <SheetHeader className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-slate-200">
                                Node ID: {task._id.slice(-6)}
                            </Badge>
                            {isLocked && (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1 animate-pulse">
                                    <Lock className="h-3 w-3" /> Locked
                                </Badge>
                            )}
                        </div>
                        <div className="space-y-1">
                            <SheetTitle className="text-3xl font-bold tracking-tight text-slate-900 leading-tight">
                                {task.title}
                            </SheetTitle>
                            <div className="flex items-center gap-3 pt-2">
                                <Badge className={`h-6 px-3 rounded-full text-[10px] font-bold uppercase ${statusColors[task.status as keyof typeof statusColors] || 'bg-slate-100 text-slate-700'}`}>
                                    {task.status}
                                </Badge>
                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                                    <div className={`h-2 w-2 rounded-full ${priorityColors[task.priority as keyof typeof priorityColors] || 'bg-gray-500'}`} />
                                    {task.priority} Priority
                                </div>
                            </div>
                        </div>
                    </SheetHeader>

                    <Tabs defaultValue="details" className="w-full">
                        <TabsList className="w-fit bg-slate-100/50 p-1 rounded-xl mb-8 border border-slate-200/50">
                            <TabsTrigger value="details" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">
                                <FileText className="h-4 w-4 mr-2" />
                                Details
                            </TabsTrigger>
                            <TabsTrigger 
                                value="progress" 
                                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6"
                                disabled={isLocked}
                            >
                                <TrendingUp className="h-4 w-4 mr-2" />
                                Progress Velocity
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Meta Grid */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                                    <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Completion</div>
                                    <div className="text-2xl font-bold text-slate-900">{task.progress || 0}%</div>
                                    <div className="w-full bg-slate-200 rounded-full h-1 mt-2">
                                        <div className="bg-indigo-600 h-1 rounded-full transition-all" style={{ width: `${task.progress || 0}%` }} />
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                                    <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Weightage</div>
                                    <div className="text-2xl font-bold text-slate-900">{task.weight || 0}</div>
                                    <div className="text-[10px] text-slate-400 font-medium">Impact on parent</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                                    <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Hierarchy</div>
                                    <div className="text-2xl font-bold text-slate-900">Lvl {task.level || 0}</div>
                                    <div className="text-[10px] text-slate-400 font-medium">Graph depth</div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-widest">
                                    <AlignLeft className="h-4 w-4 text-indigo-500" />
                                    Scope & Description
                                </div>
                                <div className="p-5 rounded-2xl bg-white border border-slate-100 text-slate-600 leading-relaxed shadow-sm">
                                    {task.description || 'No detailed description provided for this task node.'}
                                </div>
                            </div>

                            {/* People & Time */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <div className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                        <User className="h-4 w-4 text-indigo-500" /> Ownership
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-50 bg-slate-50/30">
                                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                                {(typeof task.assignedTo !== 'string' && task.assignedTo?.name?.charAt(0)) || '?'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Assignee</span>
                                                <span className="text-sm font-semibold text-slate-700">{(typeof task.assignedTo !== 'string' && task.assignedTo?.name) || 'Unassigned'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-indigo-500" /> Timeline
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        <div className="p-3 rounded-xl border border-slate-50 bg-slate-50/30 flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                                <Clock className="h-4 w-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Target Due Date</span>
                                                <span className="text-sm font-semibold text-slate-700">
                                                    {task.dates?.toCompleteDate ? format(new Date(task.dates.toCompleteDate), 'PPP') : 'Open Ended'}
                                                </span>
                                            </div>
                                        </div>
                                        {task.predictedEndDate && (
                                            <div className="p-3 rounded-xl border border-slate-50 bg-indigo-50/30 flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                    <TrendingUp className="h-4 w-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Predicted Completion</span>
                                                    <span className={`text-sm font-bold ${
                                                        task.dates?.toCompleteDate && new Date(task.predictedEndDate) > new Date(task.dates.toCompleteDate) 
                                                            ? 'text-red-500' 
                                                            : 'text-indigo-600'
                                                    }`}>
                                                        {format(new Date(task.predictedEndDate), 'PPP')}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Subtask Breakdown */}
                            {subtasks.length > 0 && (
                                <div className="space-y-3">
                                    <div className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Layers className="h-4 w-4 text-indigo-500" /> Node Breakdown
                                        </div>
                                        <Badge variant="outline" className="bg-slate-50 text-[10px] font-black">{subtasks.length} Subtasks</Badge>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {subtasks.map((st) => (
                                            <div key={st._id} className="p-4 rounded-2xl border border-slate-100 bg-white hover:border-indigo-200 transition-all shadow-sm group">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                            {st.weight}%
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-900">{st.title}</span>
                                                            <span className="text-[10px] text-slate-400 font-medium">Predicted: {st.predictedEndDate ? format(new Date(st.predictedEndDate), 'MMM d') : 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex flex-col items-end mr-2">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Completion</span>
                                                            <span className="text-xs font-black text-indigo-600">{st.progress || 0}%</span>
                                                        </div>
                                                        <Badge className={`h-5 px-2 rounded-full text-[9px] font-bold uppercase ${statusColors[st.status as keyof typeof statusColors] || 'bg-slate-100 text-slate-700'}`}>
                                                            {st.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                    <div 
                                                        className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                                                        style={{ width: `${st.progress || 0}%` }} 
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Dependencies */}
                            {task.dependencies && (task.dependencies as any[]).length > 0 && (
                                <div className="space-y-3">
                                    <div className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                        <Link className="h-4 w-4 text-indigo-500" /> Blocking Requirements
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {(task.dependencies as any[]).map((dep) => (
                                            <div key={dep._id || dep} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-slate-300 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-2 w-2 rounded-full bg-amber-400" />
                                                    <span className="text-sm font-bold text-slate-700">{dep.title || 'Task Node'}</span>
                                                </div>
                                                <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest">
                                                    {dep.status || 'Active'}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="progress" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="p-8 rounded-3xl bg-slate-900 text-white space-y-6 shadow-2xl shadow-slate-200">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Current Velocity</div>
                                        <div className="text-4xl font-black">{task.progress || 0}%</div>
                                    </div>
                                    <TrendingUp className="h-10 w-10 text-indigo-400 opacity-50" />
                                </div>
                                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                                    <div className="bg-indigo-500 h-full rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all duration-700" style={{ width: `${task.progress || 0}%` }} />
                                </div>
                            </div>

                            {isLeafTask && canUpdateProgress && (
                                <div className="space-y-4">
                                    <div className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                        <Plus className="h-4 w-4 text-indigo-500" /> Increment Progress
                                    </div>
                                    <div className="flex flex-col gap-6 p-6 rounded-2xl border border-slate-100 bg-slate-50/30">
                                        <div className="flex items-center justify-center gap-6">
                                            <Button 
                                                variant="outline" 
                                                size="icon" 
                                                className="h-14 w-14 rounded-2xl border-slate-200 text-red-500 hover:bg-red-50"
                                                onClick={() => handleProgressUpdate(false)}
                                                disabled={isUpdating}
                                            >
                                                <Minus className="h-6 w-6" />
                                            </Button>
                                            <div className="flex items-center gap-3">
                                                <Input 
                                                    type="number" 
                                                    value={progressAmount} 
                                                    onChange={(e) => setProgressAmount(e.target.value)}
                                                    className="w-24 h-14 text-center text-2xl font-black rounded-2xl border-slate-200"
                                                />
                                                <span className="text-2xl font-black text-slate-300">%</span>
                                            </div>
                                            <Button 
                                                variant="outline" 
                                                size="icon" 
                                                className="h-14 w-14 rounded-2xl border-slate-200 text-emerald-600 hover:bg-emerald-50"
                                                onClick={() => handleProgressUpdate(true)}
                                                disabled={isUpdating}
                                            >
                                                <Plus className="h-6 w-6" />
                                            </Button>
                                        </div>
                                        <Input 
                                            placeholder="Add a progress log entry..." 
                                            value={progressNote}
                                            onChange={(e) => setProgressNote(e.target.value)}
                                            className="h-12 rounded-xl border-slate-200 bg-white"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    <History className="h-4 w-4 text-indigo-500" /> Velocity History
                                </div>
                                <div className="space-y-3">
                                    {task.progressHistory && task.progressHistory.length > 0 ? (
                                        task.progressHistory.slice().reverse().map((entry, idx) => (
                                            <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl border border-slate-50 bg-white shadow-sm">
                                                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 font-bold text-xs">
                                                    {entry.progress}%
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{format(new Date(entry.timestamp), 'PPp')}</div>
                                                    <div className="text-sm text-slate-600 font-medium">{entry.note || 'Progress adjustment recorded.'}</div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-10 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                                            <Info className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                                            <p className="text-sm text-slate-400">No progress history found for this node.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="p-8 border-t border-slate-50 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {canUpdateProgress && (
                                <UpdateTaskSheet
                                    task={task}
                                    project={project}
                                    onTaskUpdated={onTaskUpdated!}
                                    trigger={
                                        <Button variant="outline" className="rounded-xl h-11 px-6 border-slate-200 font-bold text-slate-700">
                                            Edit Configuration
                                        </Button>
                                    }
                                />
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            {onAddSubtask && (canUpdateProgress || task.createdBy === project.createdBy) && (
                                <Button 
                                    onClick={() => { onAddSubtask(task._id); onOpenChange(false); }}
                                    className="rounded-xl h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                                >
                                    <Plus className="h-4 w-4 mr-2" /> Add Subtask
                                </Button>
                            )}
                            <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-11 px-6">
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
