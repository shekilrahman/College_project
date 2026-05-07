import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, CalendarDays, Settings2, ArrowLeft, Lock, UserCircle } from 'lucide-react'
import { getProjectById } from '@/api/projects'
import { getTasks } from '@/api/tasks'
import { Project, Task } from '@/api/types'
import { CreateTaskSheet } from '@/components/CreateTaskSheet'
import { UpdateProjectSheet } from '@/components/UpdateProjectSheet'
import { useAuth } from '@/context/AuthContext'
import { ProjectNetworkGraph } from '@/components/ProjectNetworkGraph'
import { ViewModeNotch } from '@/components/ViewModeNotch'
import { SimulationModal } from '@/components/SimulationModal'
import { simulateTasks, SimulationConditions } from '@/api/tasks'
import { format } from 'date-fns'

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
  const [baselineTasks, setBaselineTasks] = useState<Task[]>([]); // To track drift
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
      
      const creatorId = typeof projData.createdBy === 'string' ? projData.createdBy : projData.createdBy?._id;
      const isAdmin = user?.type === 'admin';
      const isProjectCreator = user?._id === creatorId;

      if (isAdmin || isProjectCreator) {
        setTasks(tasksData);
        setBaselineTasks(tasksData);
      } else {
        // Filter tasks under user hierarchy
        const myTasks = tasksData.filter(t => {
            const assignedId = typeof t.assignedTo === 'string' ? t.assignedTo : t.assignedTo?._id;
            return assignedId === user?._id;
        });

        const myHierarchyIds = new Set<string>();
        
        const addChildren = (parentId: string) => {
            if (myHierarchyIds.has(parentId)) return;
            myHierarchyIds.add(parentId);
            
            tasksData.forEach(t => {
                const pid = typeof t.parentTask === 'string' ? t.parentTask : t.parentTask?._id;
                if (pid === parentId) {
                    addChildren(t._id);
                }
            });
        };

        myTasks.forEach(t => addChildren(t._id));
        
        const filteredTasks = tasksData.filter(t => myHierarchyIds.has(t._id));
        setTasks(filteredTasks);
        setBaselineTasks(filteredTasks);
      }
      
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

  const getStatusConfig = (status: string) => {
    switch (status) {
        case 'Active':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'Completed':
            return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'On Hold':
            return 'bg-amber-50 text-amber-700 border-amber-200';
        default:
            return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex w-full h-[calc(100vh-64px)] overflow-hidden bg-slate-50 animate-in fade-in duration-700">
      {/* Sidebar */}
      <div className="w-80 h-full bg-white border-r border-slate-200 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
        
        {/* Project Header Info */}
        <div className="p-6 border-b border-slate-100 space-y-4">
          <button 
            onClick={() => navigate({ to: '/dashboard' })} 
            className="flex items-center text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="h-3 w-3 mr-1.5" /> Back to Workspace
          </button>
          
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-2 leading-tight">
              {project.title}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={`px-2 py-0 h-5 text-[10px] font-bold uppercase tracking-tight border ${getStatusConfig(project.status)}`}>
                {project.status}
              </Badge>
              <div className="flex items-center gap-1.5 bg-slate-100 text-slate-600 px-2 h-5 rounded-md text-[10px] font-bold">
                <UserCircle className="h-3 w-3" />
                {creatorName || 'System'}
              </div>
            </div>
          </div>
          
          {project.description && (
            <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">
              {project.description}
            </p>
          )}
        </div>

        {/* Utility Actions */}
        <div className="p-6 border-b border-slate-100 space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Project Controls</h3>
          
          <div className="space-y-2.5">
            {isProjectCreator && (
              <CreateTaskSheet
                onTaskCreated={fetchProjectData}
                projects={[project]}
                defaultProjectId={project._id}
                trigger={
                  <Button className="w-full justify-start h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm">
                    <Plus className="h-4 w-4 mr-2" /> Create Task
                  </Button>
                }
              />
            )}
            
            <Button 
              variant={isSimulationActive ? 'default' : 'secondary'}
              className={`w-full justify-start h-10 rounded-xl shadow-sm ${isSimulationActive ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'}`}
              onClick={() => setSimulationOpen(true)}
            >
              <CalendarDays className="h-4 w-4 mr-2" /> 
              {isSimulationActive ? 'Simulation Active' : 'Run Simulation'}
            </Button>

            {isProjectCreator && (
              <UpdateProjectSheet 
                project={project} 
                onProjectUpdated={fetchProjectData}
                trigger={
                  <Button variant="ghost" className="w-full justify-start h-10 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                    <Settings2 className="h-4 w-4 mr-2" /> Project Settings
                  </Button>
                }
              />
            )}
          </div>
        </div>

        {/* Simulation Impact Summary */}
        {isSimulationActive && (
          <div className="p-6 border-b border-indigo-100 bg-indigo-50/30">
             <h3 className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 mb-3">Simulation Impact</h3>
             <div className="space-y-3">
                {(() => {
                  const affectedTasks = tasks.filter(t => {
                    const baseline = baselineTasks.find(bt => bt._id === t._id);
                    if (!baseline || !t.predictedEndDate || !baseline.predictedEndDate) return false;
                    return new Date(t.predictedEndDate).getTime() !== new Date(baseline.predictedEndDate).getTime();
                  });

                  if (affectedTasks.length === 0) return <div className="text-xs text-slate-500 italic">No nodes affected by this scenario.</div>;

                  return (
                    <>
                      <div className="text-[10px] font-bold text-slate-700 bg-white px-2 py-1 rounded border border-indigo-100 w-fit">
                        {affectedTasks.length} NODES AFFECTED
                      </div>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                        {affectedTasks.map(t => {
                           const baseline = baselineTasks.find(bt => bt._id === t._id);
                           const oldDate = new Date(baseline!.predictedEndDate!);
                           const newDate = new Date(t.predictedEndDate!);
                           const diffDays = Math.ceil((newDate.getTime() - oldDate.getTime()) / (1000 * 60 * 60 * 24));
                           
                           return (
                             <div key={t._id} className="text-[10px] flex flex-col gap-0.5 p-2 bg-white rounded border border-slate-100">
                                <div className="font-bold truncate text-slate-800">{t.title}</div>
                                <div className="flex items-center justify-between">
                                   <span className="text-slate-400 font-medium">{format(oldDate, 'MMM d')} → {format(newDate, 'MMM d')}</span>
                                   <span className={`font-black ${diffDays > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                      {diffDays > 0 ? `+${diffDays}d` : `${diffDays}d`}
                                   </span>
                                </div>
                             </div>
                           );
                        })}
                      </div>
                    </>
                  );
                })()}
             </div>
          </div>
        )}

        {/* Label Guide */}
        <div className="p-6 flex-1 overflow-y-auto">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4">Network Graph Guide</h3>
          <div className="space-y-4">
              <div className="flex items-center gap-3">
                  <div className="w-8 h-0 border-t-2 border-slate-400 border-solid"></div>
                  <span className="text-xs font-semibold text-slate-600">Parent / Child Flow</span>
              </div>
              <div className="flex items-center gap-3">
                  <div className="w-8 h-0 border-t-2 border-orange-400 border-dashed"></div>
                  <span className="text-xs font-semibold text-slate-600">Coupled Dependency</span>
              </div>
              
              <div className="w-full h-px bg-slate-100 my-4" />
              
              <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-md bg-[#dcfce7] border border-green-200 shadow-sm"></div>
                  <span className="text-xs font-semibold text-slate-600">Assigned to me</span>
              </div>
              <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-md bg-[#e0f2fe] border border-sky-200 shadow-sm"></div>
                  <span className="text-xs font-semibold text-slate-600">Created by me</span>
              </div>
              <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-md bg-[#f8fafc] border border-slate-200 shadow-sm"></div>
                  <span className="text-xs font-semibold text-slate-600 flex items-center">
                    <Lock className="w-3 h-3 text-red-400 mr-1.5" /> Blocked by Dep.
                  </span>
              </div>
          </div>
        </div>
      </div>

      {/* Main Graph Area */}
      <div className="flex-1 relative bg-slate-50">
        <ProjectNetworkGraph
          tasks={tasks}
          project={project}
          onAddSubtask={handleCreateSubtask}
          currentUserId={user?._id}
          isProjectCreator={isProjectCreator}
          onTaskUpdated={fetchProjectData}
          baselineTasks={isSimulationActive ? baselineTasks : undefined}
        />
      </div>

      {/* Controlled Create Task Sheet for Subtasks */}
      <CreateTaskSheet
        open={createSubtaskOpen}
        onOpenChange={setCreateSubtaskOpen}
        onTaskCreated={handleSubtaskCreated}
        projects={[project]}
        defaultProjectId={project._id}
        defaultParentId={subtaskParentId}
        parentTaskId={subtaskParentId}
        trigger={null}
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
