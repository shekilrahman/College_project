import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, UserCircle, ArrowRight, FolderKanban } from 'lucide-react'
import { CreateProjectDialog } from '@/components/CreateProjectDialog'
import { getProjects } from '@/api/projects'
import { Project } from '@/api/types'
import { useAuth } from '@/context/AuthContext'

export const Route = createFileRoute('/dashboard/')({
    component: DashboardComponent,
})

function DashboardComponent() {
    const [projects, setProjects] = useState<Project[]>([]);
    const { user } = useAuth();

    const canCreateProject = user?.type === 'admin' || user?.type === 'pm';

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const data = await getProjects();
            setProjects(data);
        } catch (error) { console.error(error); }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Welcome back, <span className="font-medium text-foreground">{user?.name}</span>
                    </p>
                </div>
                {canCreateProject && (
                    <CreateProjectDialog onProjectCreated={fetchProjects} />
                )}
            </div>

            {/* Projects Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold tracking-tight">Recent Projects</h2>
                    {/* Filter/Sort controls could go here */}
                </div>

                {projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-xl border-muted-foreground/25 bg-muted/50">
                        <FolderKanban className="h-12 w-12 text-muted-foreground opacity-50 mb-3" />
                        <h3 className="text-lg font-medium">No projects found</h3>
                        <p className="text-muted-foreground mb-4 max-w-sm">
                            Get started by creating your first project using the button above.
                        </p>
                        {canCreateProject && (
                            <CreateProjectDialog onProjectCreated={fetchProjects} />
                        )}
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {projects.map(project => (
                            <Link
                                key={project._id}
                                to="/dashboard/projects/$projectId"
                                params={{ projectId: project._id }}
                                className="group focus:outline-none"
                            >
                                <Card className="h-full overflow-hidden hover:shadow-md transition-all duration-300 border-border/60 hover:border-primary/50 group-hover:scale-[1.01]">
                                    <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start gap-4">
                                            <CardTitle className="text-lg font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                                                {project.title}
                                            </CardTitle>
                                            <Badge variant={project.status === 'Completed' ? "default" : "secondary"} className="uppercase text-[10px] tracking-wider px-2 py-0.5 h-auto">
                                                {project.status}
                                            </Badge>
                                        </div>
                                        <CardDescription className="line-clamp-2 text-sm mt-1">
                                            {project.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-3.5 w-3.5" />
                                                <span>{new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <UserCircle className="h-3.5 w-3.5" />
                                                <span className="font-medium text-foreground">
                                                    {(typeof project.createdBy !== 'string' && project.createdBy?.name) || 'Unknown'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-end">
                                            <span className="text-xs font-medium text-primary flex items-center gap-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                                View Details <ArrowRight className="h-3 w-3" />
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
