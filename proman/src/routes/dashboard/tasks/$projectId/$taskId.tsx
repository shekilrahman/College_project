import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getTaskById, updateTaskProgress, completeTask } from '@/api/tasks'
import { Task } from '@/api/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
    ArrowLeft, 
    TrendingUp, 
    Clock, 
    Calendar, 
    Plus, 
    Minus, 
    History,
    FileText,
    AlignLeft,
    User,
    CheckCircle2,
    Activity,
    Info,
    Layout
} from 'lucide-react'
import { format } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

export const Route = createFileRoute('/dashboard/tasks/$projectId/$taskId')({
    component: TaskDetailPageComponent,
})

function TaskDetailPageComponent() {
    const { projectId, taskId } = Route.useParams();
    const [task, setTask] = useState<Task | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [targetProgress, setTargetProgress] = useState(0);
    const [progressNote, setProgressNote] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        fetchTask();
    }, [taskId]);

    const fetchTask = async () => {
        setIsLoading(true);
        try {
            const data = await getTaskById(taskId);
            setTask(data);
            setTask(data);
            setTargetProgress(data.progress || 0);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load task details');
        } finally {
            setIsLoading(false);
        }
    };

    const handleIncrement = () => setTargetProgress(p => Math.min(100, p + 5));
    const handleDecrement = () => setTargetProgress(p => Math.max(0, p - 5));

    const submitProgressUpdate = async () => {
        if (!task) return;
        const currentTotal = task.progress || 0;
        const diff = targetProgress - currentTotal;
        
        if (diff === 0 && !progressNote) {
            toast.info("No changes to apply.");
            return;
        }

        setIsUpdating(true);
        try {
            const amount = diff > 0 ? `+${diff}` : `${diff}`;
            await updateTaskProgress(task._id, { amount, note: progressNote || undefined });
            toast.success('Progress updated successfully');
            setProgressNote('');
            fetchTask();
        } catch (error: any) {
            console.error('Failed to update progress:', error);
            toast.error(error.response?.data?.message || 'Failed to update progress');
        } finally {
            setIsUpdating(false);
        }
    };
    const submitCompletion = async () => {
        if (!task) return;
        setIsUpdating(true);
        try {
            await completeTask(task._id);
            toast.success('Task marked as completed!');
            fetchTask();
        } catch (error: any) {
            console.error('Failed to complete task:', error);
            toast.error(error.response?.data?.message || 'Failed to complete task');
        } finally {
            setIsUpdating(false);
        }
    };


    if (isLoading) {
        return (
            <div className="w-full px-8 space-y-8">
                <Skeleton className="h-10 w-64" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Skeleton className="h-[600px] lg:col-span-2 rounded-3xl" />
                    <Skeleton className="h-[400px] rounded-3xl" />
                </div>
            </div>
        );
    }

    if (!task) return null;

    const statusColors = {
        'Pending': 'bg-slate-100 text-slate-700',
        'In Progress': 'bg-blue-100 text-blue-700',
        'Completed': 'bg-green-100 text-green-700'
    };

    return (
        <div className="w-full px-8 space-y-10 animate-in fade-in slide-in-from-right-4 duration-700 ease-out pb-20">
            {/* Navigation */}
            <Link 
                to="/dashboard/tasks/$projectId" 
                params={{ projectId }}
                className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors group w-fit"
            >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-widest">Back to Workspace</span>
            </Link>

            {/* OVERVIEW SECTION */}
            <div className="flex flex-col space-y-6">
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-slate-50 text-[10px] font-bold text-slate-400 border-slate-200 px-3">
                        NODE: {task._id.slice(-6).toUpperCase()}
                    </Badge>
                    <Badge className={`${statusColors[task.status as keyof typeof statusColors] || 'bg-slate-100 text-slate-700'} border-none px-3 py-1 rounded-full text-[10px] font-black uppercase`}>
                        {task.status}
                    </Badge>
                    {task.priority && (
                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-slate-200">
                            {task.priority} Priority
                        </Badge>
                    )}
                </div>
                <h1 className="text-5xl font-black tracking-tighter text-slate-900 leading-tight">
                    {task.title}
                </h1>
                <div className="text-lg text-slate-600 leading-relaxed font-medium max-w-4xl">
                    {task.description || 'No detailed scope provided for this technical task node.'}
                </div>
            </div>

            {/* METRICS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Layout className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Hierarchy</span>
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-slate-500">Parent Node</div>
                        <div className="text-lg font-bold text-slate-900 truncate">
                            {task.parentTask ? (typeof task.parentTask === 'object' ? task.parentTask.title : task.parentTask) : 'Root / No Parent'}
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Calendar className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Schedule</span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-slate-500">Target</span>
                            <span className="text-sm font-bold text-slate-900">
                                {task.dates?.toCompleteDate ? format(new Date(task.dates.toCompleteDate), 'MMM d, yyyy') : 'Open'}
                            </span>
                        </div>
                        {task.predictedEndDate && (
                            <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                                <span className="text-xs font-semibold text-indigo-500">Predicted</span>
                                <span className="text-sm font-bold text-indigo-600">
                                    {format(new Date(task.predictedEndDate), 'MMM d, yyyy')}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Activity className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Impact</span>
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-slate-500">Weightage</div>
                        <div className="text-2xl font-black text-slate-900">{task.weight || 0}%</div>
                    </div>
                </div>

                <div className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 text-slate-400">
                        <User className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Blocking</span>
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-slate-500">Dependencies</div>
                        <div className="text-lg font-bold text-slate-900">
                            {task.dependencies && task.dependencies.length > 0 ? `${task.dependencies.length} Items` : 'None'}
                        </div>
                    </div>
                </div>
            </div>

            {/* LOGS SECTION WITH EMBEDDED UPDATER */}
            <Card className="border-none bg-white rounded-[2.5rem] shadow-sm border border-slate-50 overflow-hidden">
                {/* Section Header: Progress Updater (Log Adding) */}
                <div className="bg-indigo-900 p-10 text-white">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                        <div className="space-y-4 lg:max-w-md">
                            {(() => {
                                const currentTotal = task.progress || 0;
                                return (
                                    <>
                                        <div className="space-y-1">
                                            <h3 className="text-2xl font-black tracking-tight">Synchronize Velocity</h3>
                                            <p className="text-indigo-300 text-sm font-medium italic">Record a new progress entry for this node.</p>
                                        </div>
                                        
                                        <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl">
                                            <div className="h-12 w-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                                <Clock className="h-6 w-6 text-indigo-300" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Remaining Work</div>
                                                <div className="text-2xl font-black text-white">{100 - currentTotal}%</div>
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        {task.progress === 100 && task.status !== 'Completed' ? (
                            <div className="flex-1 flex flex-col items-center justify-center bg-white/5 p-8 rounded-[2rem] border border-white/10 space-y-4">
                                <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center border-2 border-emerald-500/50">
                                    <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                                </div>
                                <div className="text-center">
                                    <h4 className="text-white font-bold text-xl">Target Achieved</h4>
                                    <p className="text-indigo-300 text-sm">Velocity has reached 100%. Finalize to recalculate schedule.</p>
                                </div>
                                <Button 
                                    className="w-full max-w-sm h-14 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest shadow-xl transition-all"
                                    onClick={submitCompletion}
                                    disabled={isUpdating}
                                >
                                    {isUpdating ? 'Finalizing...' : 'Mark Node as Completed'}
                                </Button>
                            </div>
                        ) : task.status === 'Completed' ? (
                            <div className="flex-1 flex flex-col items-center justify-center bg-emerald-900/20 p-8 rounded-[2rem] border border-emerald-500/20 space-y-3">
                                <CheckCircle2 className="h-12 w-12 text-emerald-400" />
                                <div className="text-center">
                                    <h4 className="text-emerald-400 font-bold text-xl">Node Completed</h4>
                                    <p className="text-emerald-300/70 text-sm">This task has been finalized and integrated.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col sm:flex-row items-center gap-8 bg-white/5 p-8 rounded-[2rem] border border-white/10">
                                <div className="flex items-center gap-4">
                                    <Button 
                                        variant="outline" size="icon" 
                                        className="h-14 w-14 rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white hover:text-indigo-900 transition-all shadow-lg shrink-0"
                                        onClick={handleDecrement} disabled={isUpdating || targetProgress <= 0}
                                    >
                                        <Minus className="h-6 w-6" />
                                    </Button>
                                    
                                    <div className="flex flex-col items-center">
                                        <div className="w-28 h-20 flex items-center justify-center bg-white/10 border-2 border-white/20 rounded-[1.5rem] shadow-inner relative overflow-hidden">
                                            <span className="text-5xl font-black text-white tracking-tighter">{targetProgress}</span>
                                            <span className="text-xl font-bold text-indigo-300 ml-1">%</span>
                                        </div>
                                        <div className="h-6 flex items-center justify-center mt-2">
                                            {(() => {
                                                const currentTotal = task.progress || 0;
                                                const diff = targetProgress - currentTotal;
                                                return diff !== 0 && (
                                                    <Badge variant="outline" className={`border-none font-bold tracking-widest uppercase text-[8px] px-2 py-0.5 ${diff > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                                                        {diff > 0 ? '+' : '-'}{Math.abs(diff)}%
                                                    </Badge>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    <Button 
                                        variant="outline" size="icon" 
                                        className="h-14 w-14 rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white hover:text-indigo-900 transition-all shadow-lg shrink-0"
                                        onClick={handleIncrement} disabled={isUpdating || targetProgress >= 100}
                                    >
                                        <Plus className="h-6 w-6" />
                                    </Button>
                                </div>

                                <div className="flex-1 w-full space-y-4">
                                    <Input 
                                        placeholder="Add a detailed activity log entry..." 
                                        value={progressNote}
                                        onChange={(e) => setProgressNote(e.target.value)}
                                        className="h-14 bg-white/10 border-white/20 text-white rounded-xl placeholder:text-indigo-400/50 text-base"
                                    />
                                    <Button 
                                        className="w-full h-14 rounded-xl bg-white text-indigo-900 font-black uppercase tracking-widest hover:bg-indigo-50 shadow-xl"
                                        onClick={submitProgressUpdate}
                                        disabled={isUpdating}
                                    >
                                        {isUpdating ? 'Saving Update...' : 'Commit Log & Sync Velocity'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Section Body: Logs Table */}
                <div className="p-10">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <History className="h-5 w-5" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Velocity Logs</h3>
                        </div>
                        <Badge variant="outline" className="rounded-full px-4 border-slate-200 text-slate-400 font-bold">
                            {task.progressHistory?.length || 0} Entries
                        </Badge>
                    </div>

                    <div className="w-full overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-slate-100">
                                    <th className="py-4 px-6 text-xs font-black uppercase tracking-widest text-slate-400 w-48">Date & Time</th>
                                    <th className="py-4 px-6 text-xs font-black uppercase tracking-widest text-slate-400 w-32">Velocity</th>
                                    <th className="py-4 px-6 text-xs font-black uppercase tracking-widest text-slate-400">Activity Note</th>
                                </tr>
                            </thead>
                            <tbody>
                                {task.progressHistory && task.progressHistory.length > 0 ? (
                                    task.progressHistory.slice().reverse().map((entry, idx) => (
                                        <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                            <td className="py-5 px-6 whitespace-nowrap">
                                                <div className="text-sm font-bold text-slate-600">
                                                    {format(new Date(entry.timestamp), 'MMM d, yyyy')}
                                                </div>
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                    {format(new Date(entry.timestamp), 'h:mm a')}
                                                </div>
                                            </td>
                                            <td className="py-5 px-6">
                                                <Badge className={`border-none font-black px-3 py-1 text-sm transition-colors ${
                                                    entry.progress > 0 
                                                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white' 
                                                        : entry.progress < 0 
                                                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white'
                                                            : 'bg-slate-100 text-slate-900 hover:bg-indigo-600 hover:text-white'
                                                }`}>
                                                    {entry.progress > 0 ? '+' : ''}{entry.progress}%
                                                </Badge>
                                            </td>
                                            <td className="py-5 px-6">
                                                <div className="text-sm font-medium text-slate-700">
                                                    {entry.note || <span className="text-slate-300 italic">Regular progress synchronization</span>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="py-16 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <Info className="h-10 w-10 text-slate-200" />
                                                <p className="text-slate-400 font-bold">No progress logs recorded yet.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Card>
        </div>
    );
}
