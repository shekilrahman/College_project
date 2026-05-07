import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getProjectById } from '@/api/projects'
import { getTasks } from '@/api/tasks'
import { Project, Task } from '@/api/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
    CheckSquare, 
    Calendar, 
    ArrowLeft, 
    ChevronRight, 
    Target,
    TrendingUp,
    Clock,
    AlertCircle,
    CheckCircle2
} from 'lucide-react'
import { format } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/dashboard/tasks/$projectId/')({
    component: ProjectTasksComponent,
})

function ProjectTasksComponent() {
    const { projectId } = Route.useParams();
    const { user } = useAuth();
    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [projectId]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [projData, allTasks] = await Promise.all([
                getProjectById(projectId),
                getTasks(projectId)
            ]);
            
            setProject(projData);

            // Identify leaf nodes
            const parentIds = new Set(allTasks.map(t => {
                const pid = typeof t.parentTask === 'string' ? t.parentTask : t.parentTask?._id;
                return pid;
            }).filter(Boolean));

            const myLeafTasks = allTasks.filter(t => {
                const isAssigned = (typeof t.assignedTo === 'string' ? t.assignedTo : t.assignedTo?._id) === user?._id;
                const isLeaf = !parentIds.has(t._id);
                return isAssigned && isLeaf;
            });

            setTasks(myLeafTasks);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load project tasks');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="w-full px-8 space-y-8">
                <Skeleton className="h-10 w-48" />
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-3xl" />)}
                </div>
            </div>
        );
    }

    if (!project) return null;

    return (
        <div className="w-full px-8 space-y-10 animate-in fade-in slide-in-from-left-4 duration-700 ease-out">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <Link 
                        to="/dashboard/tasks" 
                        className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors group w-fit"
                    >
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-bold uppercase tracking-widest">Back to Projects</span>
                    </Link>
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="h-2 w-10 bg-indigo-600 rounded-full" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">Active Workspace</span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900">{project.title}</h1>
                        <p className="text-slate-500 font-medium">Manage your specific leaf nodes for this project.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <CheckSquare className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-slate-900">{tasks.length}</div>
                        <div className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">Assigned Leaf Nodes</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {tasks.length > 0 ? (
                    tasks.map(task => (
                        <Link 
                            key={task._id} 
                            to="/dashboard/tasks/$projectId/$taskId" 
                            params={{ projectId: project._id, taskId: task._id }}
                        >
                            <Card className="group relative bg-white border border-slate-100 hover:border-indigo-200 rounded-[2rem] shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300 overflow-hidden cursor-pointer">
                                <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                    <div className="flex items-center gap-6 flex-1">
                                        <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner shrink-0">
                                            <Target className="h-7 w-7" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                                                {task.title}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-4">
                                                <Badge className="bg-slate-100 text-slate-500 border-none px-3 py-1 rounded-full text-[9px] font-black uppercase">
                                                    {task.status}
                                                </Badge>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    Due {task.dates?.toCompleteDate ? format(new Date(task.dates.toCompleteDate), 'PPP') : 'Unset'}
                                                </div>
                                                {task.predictedEndDate && (
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-500 uppercase">
                                                        <TrendingUp className="h-3.5 w-3.5" />
                                                        Predicted: {format(new Date(task.predictedEndDate), 'PPP')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-10">
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="flex items-center gap-3">
                                                <div className="text-3xl font-black text-indigo-600 leading-none">{task.progress || 0}%</div>
                                                <div className="w-32 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                                    <div 
                                                        className="bg-indigo-600 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(79,70,229,0.4)]" 
                                                        style={{ width: `${task.progress || 0}%` }} 
                                                    />
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Cumulative Completion</span>
                                        </div>
                                        <div className="h-12 w-12 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-indigo-600 group-hover:border-indigo-100 group-hover:bg-indigo-50 transition-all">
                                            <ChevronRight className="h-6 w-6" />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center p-20 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[3rem] text-center space-y-4">
                        <AlertCircle className="h-10 w-10 text-slate-300" />
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-slate-900">No Assignments</h3>
                            <p className="text-sm text-slate-500">You don't have any leaf nodes assigned to you in this project.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
