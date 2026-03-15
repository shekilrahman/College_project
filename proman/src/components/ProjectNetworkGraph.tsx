import { useMemo, useState } from 'react';
import { Plus, Lock } from 'lucide-react';
import dagre from 'dagre';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    Node,
    Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { TaskDetailDialog } from './TaskDetailDialog';

import { Task } from '@/api/types';

interface ProjectNetworkGraphProps {
    tasks: Task[];
    projectTitle: string;
    onAddSubtask?: (taskId: string) => void;
    currentUserId?: string;
    isProjectCreator?: boolean;
    onTaskUpdated?: () => void;
}

const statusColorMap: Record<string, string> = {
    'To Do': '#64748b', // slate-500
    'pending': '#64748b',
    'In Progress': '#3b82f6', // blue-500
    'in-progress': '#3b82f6',
    'Completed': '#22c55e', // green-500
    'completed': '#22c55e',
};

export function ProjectNetworkGraph({ tasks, projectTitle, onAddSubtask, currentUserId, isProjectCreator = false, onTaskUpdated }: ProjectNetworkGraphProps) {
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    // Transform tasks into nodes and edges
    const { nodes, edges } = useMemo(() => {
        const generatedEdges: Edge[] = [];
        const initialNodes: Node[] = [];

        // 1. Create Project Root Node (Rank 0)
        const projectNode: Node = {
            id: 'project-root',
            data: { label: <div className="font-bold text-lg">{projectTitle}</div> },
            position: { x: 0, y: 0 }, // Will be laid out
            type: 'input',
            style: { background: '#0f172a', color: 'white', border: 'none', borderRadius: '10px', width: 220, padding: 12, textAlign: 'center' },
        };
        initialNodes.push(projectNode);

        // Track created ghost nodes to avoid duplicates
        const ghostNodesMap = new Map<string, Node>();

        // 2. Create Task Nodes
        tasks.forEach(task => {
            const nodeId = task._id;

            // Highlight logic
            // 1. Assigned TO me (Highest Priority) -> Light Green
            const isAssignedToMe = typeof task.assignedTo !== 'string' && task.assignedTo?._id === currentUserId;
            // 2. Created BY me (Secondary Priority) -> Light Blue
            const isCreatedByMe = typeof task.createdBy !== 'string' && task.createdBy?._id === currentUserId;

            let nodeBackground = 'white';
            if (isAssignedToMe) {
                nodeBackground = '#dcfce7'; // green-100
            } else if (isCreatedByMe) {
                nodeBackground = '#e0f2fe'; // sky-100
            }

            // Derive status from progress
            const progress = task.progress || 0;
            let derivedStatus: string;
            if (progress === 0) {
                derivedStatus = 'Pending';
            } else if (progress >= 100) {
                derivedStatus = 'Completed';
            } else {
                derivedStatus = 'In Progress';
            }

            // Check if locked by dependencies
            const incompleteDependencies = (task.dependencies as Task[])?.filter?.(dep => typeof dep === 'object' && dep.status !== 'Completed') || [];
            const isLocked = incompleteDependencies.length > 0;
            if (isLocked) {
                // Dim the node
                nodeBackground = '#f8fafc'; // slate-50
            }

            initialNodes.push({
                id: nodeId,
                data: {
                    label: (
                        <div className={`min-w-[150px] relative group overflow-hidden ${isLocked ? 'opacity-70 grayscale-[50%]' : ''}`}>
                            {/* Content */}
                            <div className="p-2">
                                <div className="font-bold text-sm truncate pr-4">{task.title}</div>
                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-muted-foreground capitalize">{derivedStatus}</div>
                                    {isLocked && <Lock className="h-3 w-3 text-red-400" />}
                                </div>
                                <div className="flex flex-col gap-0.5 mt-1">
                                    {(typeof task.assignedTo !== 'string' && task.assignedTo?.name) && (
                                        <div className="text-[10px] bg-primary/10 text-primary px-1 rounded w-fit">
                                            @{task.assignedTo.name}
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-0.5">
                                        <span>Level: {task.level}</span>
                                        <span className="font-semibold text-blue-600">{progress}%</span>
                                    </div>
                                </div>
                                {/* Add Subtask Button - Only if assigned to me OR I am the project creator */}
                                {onAddSubtask && (isAssignedToMe || isProjectCreator) && (
                                    <div
                                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAddSubtask(task._id);
                                        }}
                                    >
                                        <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 cursor-pointer shadow-sm" title="Add Subtask">
                                            <Plus className="h-3 w-3" />
                                        </div>
                                    </div>
                                )}
                            </div>
                            {/* Progress Bar at Bottom */}
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )
                },
                position: { x: 0, y: 0 }, // Laid out later
                style: {
                    border: `2px solid ${statusColorMap[derivedStatus] || '#cbd5e1'}`,
                    borderRadius: '8px',
                    background: nodeBackground,
                    width: 180,
                    cursor: 'pointer',
                    overflow: 'hidden',
                },
                type: 'default',
            });
        });

        // 3. Create Edges (and Ghost Nodes for missing parents)
        tasks.forEach(task => {
            if (task.parentTask) {
                // Determine Parent ID and Data
                const parentId = typeof task.parentTask === 'string' ? task.parentTask : task.parentTask._id;
                const parentTitle = typeof task.parentTask !== 'string' ? (task.parentTask as any).title : 'Unknown Parent';

                // If parent exists in the list, link to it
                if (tasks.some(t => t._id === parentId)) {
                    generatedEdges.push({
                        id: `e-${parentId}-${task._id}`,
                        source: parentId,
                        target: task._id,
                        animated: true,
                        style: { stroke: '#64748b' },
                        type: 'smoothstep',
                    });
                } else {
                    // Parent NOT in list (Ghost Parent)
                    // Only create if we haven't already
                    if (!ghostNodesMap.has(parentId)) {
                        // Get assigner name from current task (best effort)
                        const assignerName = (typeof task.createdBy !== 'string' && task.createdBy?.name) ? task.createdBy.name : 'Unknown';
                        const ghostLevel = Math.max(0, (task.level || 1) - 1);

                        const ghostNode: Node = {
                            id: parentId,
                            data: {
                                level: ghostLevel, // Store level in data for layout
                                label: (
                                    <div className="p-2 min-w-[150px]">
                                        <div className="font-bold text-sm truncate">{parentTitle}</div>
                                        <div className="text-[10px] text-muted-foreground border-t mt-1 pt-1">
                                            Assigned by: <span className="font-semibold">{assignerName}</span>
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">
                                            Level: {ghostLevel}
                                        </div>
                                    </div>
                                )
                            },
                            position: { x: 0, y: 0 },
                            type: 'default',
                            style: {
                                background: '#f8fafc', // slate-50
                                border: '1px dashed #94a3b8', // slate-400 dashed
                                borderRadius: '8px',
                                width: 180,
                                opacity: 0.8
                            }
                        };
                        ghostNodesMap.set(parentId, ghostNode);
                        initialNodes.push(ghostNode);

                        // Link Ghost to Root (to anchor it)
                        generatedEdges.push({
                            id: `e-root-${parentId}`,
                            source: 'project-root',
                            target: parentId,
                            animated: true,
                            style: { stroke: '#cbd5e1', strokeDasharray: '5,5' },
                            type: 'smoothstep',
                        });
                    }

                    // Link Ghost -> Task
                    generatedEdges.push({
                        id: `e-${parentId}-${task._id}`,
                        source: parentId,
                        target: task._id,
                        animated: true,
                        style: { stroke: '#64748b' },
                        type: 'smoothstep',
                    });
                }
            } else {
                // No Parent -> Top Level -> Link to Project Root
                generatedEdges.push({
                    id: `e-root-${task._id}`,
                    source: 'project-root',
                    target: task._id,
                    animated: true,
                    style: { stroke: '#94a3b8' },
                    type: 'smoothstep',
                });
            }

            // Generate edges for dependencies
            if (task.dependencies && task.dependencies.length > 0) {
                (task.dependencies as any[]).forEach(dep => {
                    const depId = typeof dep === 'string' ? dep : dep._id;
                    // Ensure the dependency node actually exists in our graph view before making edge
                    if (tasks.some(t => t._id === depId) || ghostNodesMap.has(depId)) {
                        generatedEdges.push({
                            id: `dep-${depId}-${task._id}`,
                            source: depId,
                            target: task._id,
                            animated: true,
                            style: { stroke: '#fb923c', strokeDasharray: '4,4' }, // Orange dashed for dependencies
                            type: 'smoothstep',
                            label: 'Blocks',
                            labelStyle: { fill: '#fb923c', fontWeight: 700, fontSize: '10px' },
                            labelBgStyle: { fill: 'transparent' }
                        });
                    }
                });
            }
        });

        // 4. Apply Dagre Layout
        if (initialNodes.length > 0) {
            const g = new dagre.graphlib.Graph();
            g.setGraph({ rankdir: 'TB', nodesep: 150, ranksep: 120 });
            g.setDefaultEdgeLabel(() => ({}));

            const nodeWidth = 200; // Avg width with padding
            const nodeHeight = 80; // Avg height

            // Add nodes to dagre
            initialNodes.forEach(node => {
                // Adjust dimensions for specific node types
                let w = nodeWidth;
                let h = nodeHeight;
                if (node.id === 'project-root') { w = 240; h = 80; }

                g.setNode(node.id, { width: w, height: h });
            });

            // Add edges to dagre (exclude dependencies to prevent vertical stacking overlap on same level)
            generatedEdges.forEach(edge => {
                if (!edge.id.startsWith('dep-')) {
                    g.setEdge(edge.source, edge.target);
                }
            });

            // Execute Layout
            dagre.layout(g);

            // Calculate Visual Ranks to remove empty space
            // 1. Get all unique levels present in the dataset (Tasks AND Ghosts)
            const presentLevels = new Set<number>();
            initialNodes.forEach(node => {
                if (node.id === 'project-root') return;
                // Use stored level in data if available, otherwise check task list
                if (node.data.level !== undefined) {
                    presentLevels.add(node.data.level);
                } else {
                    const task = tasks.find(t => t._id === node.id);
                    if (task) presentLevels.add(task.level || 0);
                }
            });

            // 2. Sort them to determine order
            const sortedLevels = Array.from(presentLevels).sort((a, b) => a - b);
            // 3. Create a map of Level -> Visual Rank (0, 1, 2...)
            const levelToRankMap = new Map<number, number>();
            sortedLevels.forEach((lvl, index) => {
                levelToRankMap.set(lvl, index);
            });

            // Apply computed positions to nodes
            initialNodes.forEach(node => {
                const n = g.node(node.id);

                // Calculate strict Y based on COMPRESSED visual rank
                let y = n.y - (g.node(node.id).height / 2);

                if (node.id !== 'project-root') {
                    let rawLevel = 0;

                    if (node.data.level !== undefined) {
                        rawLevel = node.data.level;
                    } else {
                        const task = tasks.find(t => t._id === node.id);
                        if (task) rawLevel = task.level || 0;
                    }

                    // Use the mapped rank
                    const visualRank = levelToRankMap.get(rawLevel) || 0;

                    const LEVEL_HEIGHT = 180;
                    const BASE_OFFSET = 180;
                    y = visualRank * LEVEL_HEIGHT + BASE_OFFSET;
                } else {
                    y = 0; // Root always at top
                }

                node.position = {
                    x: n.x - (g.node(node.id).width / 2),
                    y: y,
                };
            });
        }

        return { nodes: initialNodes, edges: generatedEdges };
    }, [tasks, projectTitle, currentUserId, onAddSubtask, isProjectCreator]);

    const onNodeClick = (_: React.MouseEvent, node: Node) => {
        if (node.id === 'project-root') return;

        const task = tasks.find(t => t._id === node.id);
        if (task) {
            setSelectedTask(task);
            setDetailsOpen(true);
        }
    };

    return (
        <div className="h-full w-full bg-slate-50 relative">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodeClick={onNodeClick}
                fitView
                attributionPosition="bottom-right"
            >
                <Background gap={12} size={1} />
                <Controls />
                <MiniMap zoomable pannable />

                {/* Legend Panel */}
                <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-slate-200 z-10 w-64 pointer-events-none">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Label Guide</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-0 border-t-2 border-slate-500 border-solid"></div>
                            <span className="text-slate-700">Parent / Child</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-0 border-t-2 border-orange-400 border-dashed"></div>
                            <span className="text-slate-700">Blocks (Dependency)</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                            <div className="w-4 h-4 rounded-sm bg-[#dcfce7] border border-green-200"></div>
                            <span className="text-slate-700 text-xs">Assigned to me</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-sm bg-[#e0f2fe] border border-sky-200"></div>
                            <span className="text-slate-700 text-xs">Created by me</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-sm bg-[#f8fafc] border border-slate-200 opacity-70"></div>
                            <span className="text-slate-700 text-xs flex items-center"><Lock className="w-3 h-3 text-red-400 mr-1" />Locked by dep.</span>
                        </div>
                    </div>
                </div>
            </ReactFlow>

            <TaskDetailDialog
                task={selectedTask}
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
                onAddSubtask={onAddSubtask}
                isLeafTask={selectedTask ? !tasks.some(t => {
                    const parentId = typeof t.parentTask === 'string' ? t.parentTask : t.parentTask?._id;
                    return parentId === selectedTask._id;
                }) : false}
                canUpdateProgress={selectedTask ? (
                    // User can update progress if they are the assignee OR the creator of the task
                    (typeof selectedTask.assignedTo !== 'string' && selectedTask.assignedTo?._id === currentUserId) ||
                    (typeof selectedTask.createdBy !== 'string' && selectedTask.createdBy?._id === currentUserId)
                ) : false}
                onTaskUpdated={onTaskUpdated}
            />
        </div>
    );
}
