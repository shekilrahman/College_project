import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Calendar,
    UserCircle,
    ArrowRight,
    FolderKanban,
    Activity,
    CheckCircle2,
    PauseCircle,
    Search,
    Filter,
    MoreHorizontal,
    ExternalLink,
    Trash2,
    AlertTriangle,
} from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CreateProjectDrawer } from '@/components/CreateProjectDrawer'
import { DeleteProjectDialog } from '@/components/DeleteProjectDialog'
import { toast } from 'sonner'
import { getProjects } from '@/api/projects'
import { Project } from '@/api/types'
import { useAuth } from '@/context/AuthContext'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/formatters'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export const Route = createFileRoute('/dashboard/')({
    component: DashboardComponent,
})

function DashboardComponent() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();

    const canCreateProject = user?.type === 'admin' || user?.type === 'pm';

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        setIsLoading(true);
        try {
            const data = await getProjects();
            setProjects(data);
        } catch (error) { 
            console.error(error); 
            toast.error('Failed to fetch projects. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredProjects = projects.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (typeof p.createdBy !== 'string' && p.createdBy?.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Stats
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'Active').length;
    const completedProjects = projects.filter(p => p.status === 'Completed').length;
    const onHoldProjects = projects.filter(p => p.status === 'On Hold').length;

    const stats = [
        { label: 'Total', value: totalProjects, icon: <FolderKanban className="h-4 w-4" />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Active', value: activeProjects, icon: <Activity className="h-4 w-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Done', value: completedProjects, icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Hold', value: onHoldProjects, icon: <PauseCircle className="h-4 w-4" />, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'Active':
                return { color: 'bg-emerald-500', bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
            case 'Completed':
                return { color: 'bg-blue-500', bgColor: 'bg-blue-50 text-blue-700 border-blue-200' };
            case 'On Hold':
                return { color: 'bg-amber-500', bgColor: 'bg-amber-50 text-amber-700 border-amber-200' };
            default:
                return { color: 'bg-slate-400', bgColor: 'bg-slate-50 text-slate-700 border-slate-200' };
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header Area */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-slate-900">
                        Project Repository
                        <Badge variant="outline" className="ml-2 h-5 font-mono text-[10px] text-slate-500">
                            v0.1.0-alpha
                        </Badge>
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Manage and track institutional project lifecycles.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {canCreateProject && (
                        <CreateProjectDrawer onProjectCreated={fetchProjects} />
                    )}
                </div>
            </div>

            {/* Quick Stats Toolbar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {isLoading ? (
                    Array(4).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-xl" />
                    ))
                ) : (
                    stats.map((stat) => (
                        <div key={stat.label} className="flex items-center gap-3 p-3 rounded-xl border bg-white shadow-sm transition-all hover:border-slate-300">
                            <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-1">{stat.label}</p>
                                <p className="text-xl font-bold text-slate-900 leading-none">{stat.value}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Main Software Interface Section */}
            <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
                {/* Table Toolbar */}
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder="Filter projects by title or manager..." 
                            className="pl-9 h-9 text-sm bg-white border-slate-200 focus-visible:ring-indigo-500/20"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600">
                            <Filter className="h-3.5 w-3.5" />
                            Filters
                        </Button>
                        <div className="h-4 w-px bg-slate-200 mx-1" />
                        <p className="text-xs text-slate-500 font-medium whitespace-nowrap">
                            Showing {filteredProjects.length} projects
                        </p>
                    </div>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="w-[300px] text-xs font-bold uppercase tracking-wider text-slate-500">Project Name</TableHead>
                                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Status</TableHead>
                                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Creator</TableHead>
                                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Team</TableHead>
                                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Duration</TableHead>
                                <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="h-9 w-9 rounded-lg" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-40" />
                                                    <Skeleton className="h-3 w-60" />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center"><Skeleton className="h-5 w-16 mx-auto rounded-md" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8 rounded-md mx-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredProjects.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <FolderKanban className="h-10 w-10 mb-2 opacity-20" />
                                            <p className="text-sm font-medium">No projects found</p>
                                            <p className="text-xs">Try adjusting your filters or search query.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredProjects.map((project) => {
                                    const status = getStatusConfig(project.status);
                                    const creatorName = (typeof project.createdBy !== 'string' && project.createdBy?.name) || 'System';
                                    const creatorPhoto = typeof project.createdBy !== 'string' ? project.createdBy?.profilePhoto : null;
                                    
                                    return (
                                        <TableRow key={project._id} className="group cursor-pointer border-slate-50 hover:bg-slate-50/80 transition-colors">
                                            <TableCell className="py-3">
                                                <Link 
                                                    to="/dashboard/projects/$projectId" 
                                                    params={{ projectId: project._id }}
                                                    className="flex items-center gap-3"
                                                >
                                                    <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 group-hover:bg-white transition-colors shadow-sm">
                                                        <FolderKanban className="h-4 w-4 text-slate-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 text-sm">
                                                            {project.title}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 line-clamp-1">
                                                            {project.description || 'No description provided'}
                                                        </p>
                                                    </div>
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge 
                                                    variant="outline" 
                                                    className={`px-2 py-0 h-5 text-[10px] font-bold uppercase tracking-tight border ${status.bgColor}`}
                                                >
                                                    {project.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {creatorPhoto ? (
                                                        <img src={creatorPhoto} alt={creatorName} className="h-6 w-6 rounded-full object-cover border border-slate-200 shadow-sm" />
                                                    ) : (
                                                        <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200 shadow-sm">
                                                            <span className="text-[10px] font-bold text-indigo-700">{creatorName.charAt(0)}</span>
                                                        </div>
                                                    )}
                                                    <span className="text-sm text-slate-600 font-medium">{creatorName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center -space-x-2 overflow-hidden justify-center">
                                                    <TooltipProvider>
                                                        {project.members && project.members.length > 0 ? (
                                                            project.members.slice(0, 4).map((member: any) => (
                                                                <Tooltip key={member._id}>
                                                                    <TooltipTrigger asChild>
                                                                        <div className="h-7 w-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 cursor-pointer overflow-hidden ring-1 ring-slate-100">
                                                                            {member.profilePhoto ? (
                                                                                <img src={member.profilePhoto} alt={member.name} className="h-full w-full object-cover" />
                                                                            ) : (
                                                                                member.name.charAt(0)
                                                                            )}
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="top" className="p-2 bg-slate-900 text-white border-none rounded-xl shadow-xl">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center font-bold overflow-hidden">
                                                                                {member.profilePhoto ? (
                                                                                    <img src={member.profilePhoto} alt={member.name} className="h-full w-full object-cover" />
                                                                                ) : member.name.charAt(0)}
                                                                            </div>
                                                                            <div className="flex flex-col">
                                                                                <span className="text-xs font-bold leading-tight">{member.name}</span>
                                                                                <span className="text-[10px] text-slate-400 leading-tight">{member.email}</span>
                                                                            </div>
                                                                        </div>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            ))
                                                        ) : (
                                                            <span className="text-[10px] text-slate-300 italic">No members</span>
                                                        )}
                                                        {project.members && project.members.length > 4 && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div className="h-7 w-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 cursor-pointer ring-1 ring-slate-200 hover:bg-slate-200 transition-colors">
                                                                        +{project.members.length - 4}
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top" className="p-3 bg-slate-900 text-white border-none rounded-xl shadow-xl max-w-xs">
                                                                    <div className="flex flex-col gap-2">
                                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 border-b border-slate-700 pb-1">Additional Members</p>
                                                                        {project.members.slice(4).map((member: any) => (
                                                                            <div key={member._id} className="flex items-center gap-2">
                                                                                <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center font-bold overflow-hidden shrink-0">
                                                                                    {member.profilePhoto ? (
                                                                                        <img src={member.profilePhoto} alt={member.name} className="h-full w-full object-cover" />
                                                                                    ) : member.name.charAt(0)}
                                                                                </div>
                                                                                <div className="flex flex-col overflow-hidden">
                                                                                    <span className="text-xs font-bold leading-tight truncate">{member.name}</span>
                                                                                    <span className="text-[10px] text-slate-400 leading-tight truncate">{member.email}</span>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                    </TooltipProvider>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                                        <Calendar className="h-3 w-3 text-slate-400" />
                                                        <span>{formatDate(project.startDate)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                                                        <ArrowRight className="h-2.5 w-2.5" />
                                                        <span>{formatDate(project.endDate)}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                        <DropdownMenuItem asChild>
                                                            <Link to="/dashboard/projects/$projectId" params={{ projectId: project._id }} className="flex items-center gap-2 cursor-pointer">
                                                                 <ExternalLink className="h-3.5 w-3.5" />
                                                                 View Details
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DeleteProjectDialog 
                                                            project={project} 
                                                            onDeleted={fetchProjects}
                                                        >
                                                            <DropdownMenuItem 
                                                                onSelect={(e) => e.preventDefault()} 
                                                                className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                                            >
                                                                 <Trash2 className="mr-2 h-4 w-4" />
                                                                 Delete Project
                                                            </DropdownMenuItem>
                                                        </DeleteProjectDialog>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Table Footer */}
                <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                        Proman Core v0.1
                    </p>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            System Online
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}
