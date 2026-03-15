import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { getProjectById } from '@/api/projects'
import { getTasks } from '@/api/tasks'
import { Project, Task } from '@/api/types'
import { CreateTaskDialog } from '@/components/CreateTaskDialog'
import { useAuth } from '@/context/AuthContext'
import { ProjectNetworkGraph } from '@/components/ProjectNetworkGraph'
import { ProjectTimeline } from '@/components/ProjectTimeline'
import { ViewModeNotch, ViewMode } from '@/components/ViewModeNotch'

export const Route = createFileRoute('/dashboard/projects/$projectId')({
  component: ProjectDetailComponent,
})

function ProjectDetailComponent() {
  const params = Route.useParams();
  const projectId = params.projectId;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // View Mode
  const [viewMode, setViewMode] = useState<ViewMode>('graph');

  // Subtask Control
  const [createSubtaskOpen, setCreateSubtaskOpen] = useState(false);
  const [subtaskParentId, setSubtaskParentId] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  // Handle ESC key to go back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate({ to: '/dashboard' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const fetchProjectData = async () => {
    setLoading(true);
    try {
      const [projData, tasksData] = await Promise.all([
        getProjectById(projectId),
        getTasks(projectId)
      ]);
      setProject(projData);
      setTasks(tasksData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubtask = (taskId: string) => {
    setSubtaskParentId(taskId);
    setCreateSubtaskOpen(true);
  };

  const handleSubtaskCreated = () => {
    setCreateSubtaskOpen(false);
    setSubtaskParentId(undefined);
    fetchProjectData();
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-pulse text-lg text-muted-foreground font-medium">Loading workspace...</div>
    </div>
  );

  if (!project) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-lg text-destructive font-semibold">Project not found</div>
    </div>
  );

  const creatorId = typeof project.createdBy === 'string' ? project.createdBy : project.createdBy?._id;
  const isProjectCreator = user?._id === creatorId;
  const creatorName = typeof project.createdBy !== 'string' ? project.createdBy?.name : undefined;

  return (
    <div className="fixed inset-0 z-50 bg-background w-screen h-screen overflow-hidden animate-in fade-in duration-300">

      {/* Header Notch - Centered at Top */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        <ViewModeNotch
          value={viewMode}
          onChange={setViewMode}
          projectTitle={project.title}
          projectStatus={project.status}
          creatorName={creatorName}
          creatorInitial={creatorName?.charAt(0)}
          onBack={() => navigate({ to: '/dashboard' })}
        />

        {/* New Task Button - Only for Creator */}
        {isProjectCreator && (
          <CreateTaskDialog
            onTaskCreated={fetchProjectData}
            projects={[project]}
            defaultProjectId={project._id}
            trigger={
              <Button size="sm" className="shadow-lg rounded-full h-10 px-4 bg-slate-900 hover:bg-slate-800">
                <Plus className="h-4 w-4 mr-1.5" /> New Task
              </Button>
            }
          />
        )}
      </div>

      {/* Full Screen View Layer */}
      <div className="absolute inset-0 z-0">
        {viewMode === 'graph' ? (
          <ProjectNetworkGraph
            tasks={tasks}
            projectTitle={project.title}
            onAddSubtask={handleCreateSubtask}
            currentUserId={user?._id}
            isProjectCreator={isProjectCreator}
            onTaskUpdated={fetchProjectData}
          />
        ) : (
          <ProjectTimeline
            project={project}
            tasks={tasks}
            onAddSubtask={handleCreateSubtask}
            currentUserId={user?._id}
            isProjectCreator={isProjectCreator}
            onTaskUpdated={fetchProjectData}
          />
        )}
      </div>

      {/* Controlled Create Task Dialog for Subtasks */}
      <CreateTaskDialog
        open={createSubtaskOpen}
        onOpenChange={setCreateSubtaskOpen}
        onTaskCreated={handleSubtaskCreated}
        projects={[project]}
        defaultProjectId={project._id}
        defaultParentId={subtaskParentId}
        parentTaskId={subtaskParentId}
      />
    </div>
  )
}
