import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, CalendarDays } from 'lucide-react'
import { getProjectById } from '@/api/projects'
import { getTasks } from '@/api/tasks'
import { Project, Task } from '@/api/types'
import { CreateTaskDialog } from '@/components/CreateTaskDialog'
import { useAuth } from '@/context/AuthContext'
import { ProjectNetworkGraph } from '@/components/ProjectNetworkGraph'
import { ViewModeNotch } from '@/components/ViewModeNotch'
import { SimulationModal } from '@/components/SimulationModal'
import { simulateTasks, SimulationConditions } from '@/api/tasks'

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

  // Subtask Control
  const [createSubtaskOpen, setCreateSubtaskOpen] = useState(false);
  const [subtaskParentId, setSubtaskParentId] = useState<string | undefined>(undefined);

  // Simulation Control
  const [simulationOpen, setSimulationOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSimulationActive, setIsSimulationActive] = useState(false);

  const projectMembers = useMemo(() => {
    const membersMap = new Map<string, any>();
    tasks.forEach(task => {
      if (task.assignedTo && typeof task.assignedTo !== 'string') {
        membersMap.set(task.assignedTo._id, task.assignedTo);
      }
    });
    return Array.from(membersMap.values());
  }, [tasks]);

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
      setIsSimulationActive(false);
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

  const handleSimulate = async (conditions: SimulationConditions) => {
    try {
      setIsSimulating(true);
      const simulatedTasks = await simulateTasks(projectId, conditions);
      setTasks(simulatedTasks);
      setIsSimulationActive(true);
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleResetSimulation = async () => {
    await fetchProjectData();
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
          projectTitle={project.title}
          projectStatus={project.status}
          creatorName={creatorName}
          creatorInitial={creatorName?.charAt(0)}
          onBack={() => navigate({ to: '/dashboard' })}
        />

        {/* Simulate Button */}
        <Button 
          size="sm" 
          variant={isSimulationActive ? 'default' : 'secondary'}
          className={`shadow-lg rounded-full h-10 px-4 ${isSimulationActive ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
          onClick={() => setSimulationOpen(true)}
        >
          <CalendarDays className="h-4 w-4 mr-1.5" /> {isSimulationActive ? 'Simulation Active' : 'Simulate'}
        </Button>

        {/* New Task Button - Only for Creator */}
        {isProjectCreator && (
          <CreateTaskDialog
            onTaskCreated={fetchProjectData}
            projects={[project]}
            defaultProjectId={project._id}
            trigger={
              <Button size="sm" className="shadow-lg rounded-full h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white">
                <Plus className="h-4 w-4 mr-1.5" /> New Task
              </Button>
            }
          />
        )}
      </div>

      {/* Full Screen View Layer */}
      <div className="absolute inset-0 z-0">
        <ProjectNetworkGraph
          tasks={tasks}
          projectTitle={project.title}
          onAddSubtask={handleCreateSubtask}
          currentUserId={user?._id}
          isProjectCreator={isProjectCreator}
          onTaskUpdated={fetchProjectData}
        />
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

      <SimulationModal 
        open={simulationOpen}
        onOpenChange={setSimulationOpen}
        projectMembers={projectMembers as any}
        projectTasks={tasks}
        onSimulate={handleSimulate}
        onReset={handleResetSimulation}
        isSimulating={isSimulating}
      />
    </div>
  )
}
