import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getProjects } from '@/api/projects'
import { getTasks } from '@/api/tasks'
import { Project } from '@/api/types'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
    FolderKanban, 
    ArrowRight, 
    CheckCircle,
    LayoutGrid,
    Target
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

export const Route = createFileRoute('/dashboard/tasks/')({
    component: TaskProjectsComponent,
})

function TaskProjectsComponent() {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [taskCounts, setTaskCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        setIsLoading(true);
        try {
            const allProjects = await getProjects();
            const projectList: Project[] = [];
            const counts: Record<string, number> = {};

            await Promise.all(allProjects.map(async (project) => {
                const allTasks = await getTasks(project._id);
                
                const parentIds = new Set(allTasks.map(t => {
                    const pid = typeof t.parentTask === 'string' ? t.parentTask : t.parentTask?._id;
                    return pid;
                }).filter(Boolean));

                const myLeafTasks = allTasks.filter(t => {
                    const isAssigned = (typeof t.assignedTo === 'string' ? t.assignedTo : t.assignedTo?._id) === user?._id;
                    const isLeaf = !parentIds.has(t._id);
                    return isAssigned && isLeaf;
                });

                if (myLeafTasks.length > 0) {
                    projectList.push(project);
                    counts[project._id] = myLeafTasks.length;
                }
            }));

            setProjects(projectList);
            setTaskCounts(counts);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load projects');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-8 w-full px-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black tracking-tight text-slate-900">Task Center</h1>
                    <p className="text-slate-500 font-medium">Loading your active project workspaces...</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 rounded-3xl" />)}
                </div>
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in zoom-in duration-500 w-full">
                <div className="h-24 w-24 rounded-[2.5rem] bg-slate-100 flex items-center justify-center text-slate-300 shadow-inner">
                    <CheckCircle className="h-12 w-12" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-slate-900">Clear Horizon</h2>
                    <p className="text-slate-500 max-w-xs mx-auto">You don't have any assigned tasks in active projects right now.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out px-6">
            <div className="space-y-2 text-center md:text-left">
                <div className="flex items-center gap-3 mb-1 justify-center md:justify-start">
                    <div className="h-2 w-10 bg-indigo-600 rounded-full" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">Operations</span>
                </div>
                <h1 className="text-4xl font-black tracking-tight text-slate-900">Task Center</h1>
                <p className="text-slate-500 font-medium">Select a project to manage your individual assignments and track progress.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {projects.map(project => (
                    <Link 
                        key={project._id}
                        to="/dashboard/tasks/$projectId"
                        params={{ projectId: project._id }}
                        className="group relative"
                    >
                        <Card className="h-full border-none bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2 transition-all duration-500 ease-out cursor-pointer">
                            <div className="p-8 space-y-6">
                                <div className="flex items-start justify-between">
                                    <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner">
                                        <FolderKanban className="h-7 w-7" />
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none px-3 py-1 rounded-full text-[10px] font-black uppercase">
                                            {taskCounts[project._id]} Tasks
                                        </Badge>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                                        {project.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                                        {project.description || 'Active project workspace with assigned technical tasks.'}
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-slate-50 flex items-center justify-between group-hover:border-indigo-50 transition-colors">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-400 transition-colors">
                                        Enter Workspace
                                    </span>
                                    <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
