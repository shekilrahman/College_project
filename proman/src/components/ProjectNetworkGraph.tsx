import { useMemo, useState } from 'react';
import { Plus, Lock, Link2, AlertCircle, GitGraph } from 'lucide-react';
import dagre from 'dagre';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    Node,
    Edge,
    Position,
    Handle,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { TaskDetailDialog } from './TaskDetailDialog';
import { format } from 'date-fns';

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
const nodeTypes = {
    projectRoot: ({ data }: any) => (
        <div className="relative">
            <Handle type="source" position={Position.Bottom} id="bottom" className="opacity-0" />
            <Handle type="source" position={Position.Right} id="right" className="opacity-0" />
            {data.label}
        </div>
    ),
    taskNode: ({ data }: any) => (
        <div className="relative">
            <Handle type="target" position={Position.Top} id="top" className="opacity-0" />
            <Handle type="source" position={Position.Bottom} id="bottom" className="opacity-0" />
            <Handle type="target" position={Position.Left} id="left" className="opacity-0" />
            <Handle type="source" position={Position.Right} id="right" className="opacity-0" />
            {data.label}
        </div>
    ),
    ghostNode: ({ data }: any) => (
        <div className="relative">
            <Handle type="target" position={Position.Top} id="top" className="opacity-0" />
            <Handle type="source" position={Position.Bottom} id="bottom" className="opacity-0" />
            <Handle type="target" position={Position.Left} id="left" className="opacity-0" />
            <Handle type="source" position={Position.Right} id="right" className="opacity-0" />
            {data.label}
        </div>
    ),
};


export function ProjectNetworkGraph({ tasks, projectTitle, onAddSubtask, currentUserId, isProjectCreator = false, onTaskUpdated }: ProjectNetworkGraphProps) {
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    // Which node's lock icon was clicked — null means all dep edges are hidden
    const [focusedDepNodeId, setFocusedDepNodeId] = useState<string | null>(null);
    // Which node's ancestry path is shown
    const [focusedAncestryNodeId, setFocusedAncestryNodeId] = useState<string | null>(null);

    // Transform tasks into nodes and edges
    const { nodes, edges } = useMemo(() => {
        const generatedEdges: Edge[] = [];
        const initialNodes: Node[] = [];

        // Compute project-level max predicted end from backend values
        let maxProjectEnd = new Date(0);
        tasks.forEach(task => {
            if (task.predictedEndDate) {
                const d = new Date(task.predictedEndDate);
                if (d > maxProjectEnd) maxProjectEnd = d;
            }
        });

        // 1. Create Project Root Node (Rank 0)
        const projectNode: Node = {
            id: 'project-root',
            data: {
                label: (
                    <div className="flex flex-col items-center">
                        <div className="font-bold text-lg">{projectTitle}</div>
                        {maxProjectEnd.getTime() > 0 && (
                            <div className="text-xs text-slate-300 mt-1">
                                Est. Finish: <span className="text-emerald-400 font-semibold">{format(maxProjectEnd, 'MMM d, yyyy')}</span>
                            </div>
                        )}
                    </div>
                )
            },
            position: { x: 0, y: 0 },
            type: 'projectRoot',
            style: { background: '#0f172a', color: 'white', border: 'none', borderRadius: '10px', width: 240, padding: 12, textAlign: 'center' },
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
            const incompleteDependencies = (task.dependencies as (Task | string)[])?.filter?.(dep => {
                let depData: any = typeof dep === 'object' ? dep : null;
                
                if (!depData || !depData.status) {
                    const depId = (typeof dep === 'string' ? dep : (dep?._id || (dep as any)?.id))?.toString();
                    depData = tasks.find(t => t._id.toString() === depId);
                }

                const status = (depData?.status || '').toLowerCase();
                const progress = depData?.progress || 0;
                const isFinished = status === 'completed' || status === 'done' || progress >= 100;
                return !isFinished;
            }) || [];
            const isLocked = incompleteDependencies.length > 0;
            if (isLocked) {
                // Dim the node
                nodeBackground = '#f8fafc'; // slate-50
            }

            // 2. Create the node with explicit handle positions for better routing
            initialNodes.push({
                id: nodeId,
                data: {
                    label: (
                        <div className={`min-w-[150px] relative group overflow-hidden ${isLocked ? 'opacity-90 grayscale-[20%]' : ''}`}>
                            {/* Content */}
                            <div className="p-2">
                                <div className="font-bold text-sm truncate pr-4">{task.title}</div>
                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-muted-foreground capitalize">{derivedStatus}</div>
                                    {isLocked && (
                                        <div className="flex items-center gap-1 relative group/lock">
                                            <span className="text-[9px] text-red-500 font-bold">{incompleteDependencies.length}</span>
                                            <Lock className="h-3.5 w-3.5 text-red-500 cursor-help animate-pulse" />
                                            
                                            {/* Persistent Tooltip on Hover */}
                                            <div className="absolute bottom-full right-0 mb-2 z-[9999] bg-white text-slate-800 p-2 rounded-lg shadow-2xl border border-red-200 hidden group-hover/lock:block min-w-[160px] text-[10px] pointer-events-none">
                                                <div className="font-bold text-red-600 border-b border-red-100 mb-1 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    Still Blocking:
                                                </div>
                                                <div className="max-h-[100px] overflow-y-auto">
                                                    {incompleteDependencies.map((d: any, i) => (
                                                        <div key={i} className="truncate py-0.5 border-b border-slate-50 last:border-0">• {d.title || 'Incomplete Dependency'}</div>
                                                    ))}
                                                </div>
                                                <div className="mt-1 text-[8px] text-slate-400 italic">Complete these to unlock</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-0.5 mt-1">
                                    {(typeof task.assignedTo !== 'string' && task.assignedTo?.name) && (
                                        <div className="text-[10px] bg-primary/10 text-primary px-1 rounded w-fit capitalize flex gap-1 items-center">
                                            @{task.assignedTo.name}
                                            <span className="text-[8px] opacity-70">({task.assignedTo.type || 'dev'})</span>
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-1 mt-1 pb-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center justify-between text-[9px]">
                                            <span className="text-slate-500">Target:</span>
                                            <span className={task.dates?.toCompleteDate ? 'text-slate-700 font-medium' : 'text-slate-400'}>
                                                {task.dates?.toCompleteDate ? format(new Date(task.dates.toCompleteDate), 'MMM d') : 'Unset'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-[9px]">
                                            <span className="text-slate-500">Predicted:</span>
                                            {task.predictedEndDate ? (() => {
                                                const pred = new Date(task.predictedEndDate);
                                                const orig = task.dates?.toCompleteDate ? new Date(task.dates.toCompleteDate) : null;
                                                const isLate = orig && pred.getTime() > orig.getTime();
                                                return (
                                                    <span className={`font-bold ${isLate ? 'text-red-500' : 'text-emerald-600'}`}>
                                                        {format(pred, 'MMM d')}
                                                    </span>
                                                );
                                            })() : (
                                                <span className="text-slate-400">—</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-0.5 border-t pt-1 border-slate-50 dark:border-slate-800">
                                        <span>Level: {task.level}</span>
                                        <span className="font-semibold text-blue-600">{progress}%</span>
                                    </div>
                                </div>
                                {/* Coupled View Button - shown on hover when task has dependencies */}
                                {task.dependencies && (task.dependencies as any[]).length > 0 && (
                                    <div
                                        className="absolute top-1 right-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFocusedDepNodeId(prev => prev === nodeId ? null : nodeId);
                                            setFocusedAncestryNodeId(null); // Clear other filter
                                        }}
                                    >
                                        <div
                                            className={`h-6 w-6 rounded-full flex items-center justify-center cursor-pointer shadow-sm transition-colors
                                                ${focusedDepNodeId === nodeId
                                                    ? 'bg-orange-500 text-white'
                                                    : 'bg-orange-100 text-orange-600 hover:bg-orange-500 hover:text-white'}`
                                            }
                                            title={focusedDepNodeId === nodeId ? 'Hide coupled' : 'Show coupled'}
                                        >
                                            <Link2 className="h-3 w-3" />
                                        </div>
                                    </div>
                                )}
                                {/* Ancestry View Button */}
                                {nodeId !== 'project-root' && (
                                    <div
                                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFocusedAncestryNodeId(prev => prev === nodeId ? null : nodeId);
                                            setFocusedDepNodeId(null); // Clear other filter
                                        }}
                                    >
                                        <div
                                            className={`h-6 w-6 rounded-full flex items-center justify-center cursor-pointer shadow-sm transition-colors
                                                ${focusedAncestryNodeId === nodeId
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white'}`
                                            }
                                            title={focusedAncestryNodeId === nodeId ? 'Hide parent path' : 'Show parent path'}
                                        >
                                            <GitGraph className="h-3 w-3" />
                                        </div>
                                    </div>
                                )}
                                {/* Add Subtask Button - Shifted for new icons */}
                                {onAddSubtask && (isAssignedToMe || isProjectCreator) && (
                                    <div
                                        className="absolute top-8 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
                sourcePosition: Position.Bottom,
                targetPosition: Position.Top,
                style: {
                    border: `2px solid ${statusColorMap[derivedStatus] || '#cbd5e1'}`,
                    borderRadius: '8px',
                    background: nodeBackground,
                    width: 190,
                    cursor: 'pointer',
                    overflow: 'visible', 
                    zIndex: 50
                },
                type: 'taskNode',
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
                        style: { stroke: '#cbd5e1', strokeWidth: 1.5 },
                        type: 'smoothstep',
                        sourceHandle: 'bottom',
                        targetHandle: 'top',
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
                            sourcePosition: Position.Bottom,
                            targetPosition: Position.Top,
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
                            type: 'ghostNode',
                            style: {
                                background: '#f8fafc', // slate-50
                                border: '1px dashed #94a3b8', // slate-400 dashed
                                borderRadius: '8px',
                                width: 180,
                                opacity: 0.8,
                                zIndex: 50
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
                            style: { stroke: '#e2e8f0', strokeDasharray: '5,5', strokeWidth: 1 },
                            type: 'smoothstep',
                            sourceHandle: 'bottom',
                            targetHandle: 'top',
                        });
                    }

                    // Link Ghost -> Task
                    generatedEdges.push({
                        id: `e-${parentId}-${task._id}`,
                        source: parentId,
                        target: task._id,
                        animated: true,
                        style: { stroke: '#94a3b8', strokeWidth: 2 },
                        type: 'smoothstep',
                        sourceHandle: 'bottom',
                        targetHandle: 'top',
                    });
                }
            } else {
                // No Parent -> Top Level -> Link to Project Root
                generatedEdges.push({
                    id: `e-root-${task._id}`,
                    source: 'project-root',
                    target: task._id,
                    animated: true,
                    style: { stroke: '#94a3b8', strokeWidth: 2 },
                    type: 'smoothstep',
                    sourceHandle: 'bottom',
                    targetHandle: 'top',
                });
            }

            // Generate edges for dependencies
            if (task.dependencies && task.dependencies.length > 0) {
                (task.dependencies as any[]).forEach(dep => {
                    const depId = (typeof dep === 'string' ? dep : (dep?._id || dep?.id))?.toString();
                    // Ensure the dependency node actually exists in our graph view before making edge
                    if (tasks.some(t => t._id.toString() === depId) || ghostNodesMap.has(depId)) {
                        generatedEdges.push({
                            id: `dep-${depId}-${task._id}`,
                            source: depId,
                            target: task._id,
                            animated: true,
                            style: { stroke: '#fb923c', strokeDasharray: '6,3', strokeWidth: 2, opacity: 0.9 },
                            type: 'smoothstep', 
                            sourceHandle: 'right',
                            targetHandle: 'left',
                            zIndex: 1, 
                            label: 'Coupled',
                            labelStyle: { fill: '#f97316', fontWeight: 700, fontSize: '10px' },
                            labelBgStyle: { fill: 'white', fillOpacity: 0.98, rx: 8, ry: 8, stroke: '#fb923c', strokeWidth: 1 },
                            labelBgPadding: [6, 4]
                        });
                    }
                });
            }
        });

        // 4. Apply Dagre Layout
        if (initialNodes.length > 0) {
            // Calculate Level Density for Dynamic Spacing
            const levelDensity: Record<number, number> = {};
            let maxNodesInLevel = 1;
            
            initialNodes.forEach(node => {
                const lvl = node.id === 'project-root' ? -1 : (node.data.level !== undefined ? node.data.level : 1);
                levelDensity[lvl] = (levelDensity[lvl] || 0) + 1;
                if (levelDensity[lvl] > maxNodesInLevel) maxNodesInLevel = levelDensity[lvl];
            });

            // Dynamic Spacing Constants
            // Horizontal: More nodes = tighter spacing (min 150, max 400)
            const dynamicNodesep = Math.max(150, Math.min(400, 600 / Math.sqrt(maxNodesInLevel)));
            
            // Vertical: More levels = tighter spacing (min 120, max 300)
            const totalLevels = Object.keys(levelDensity).length;
            const dynamicRanksep = Math.max(120, Math.min(300, 500 / Math.log2(totalLevels + 1)));

            const g = new dagre.graphlib.Graph();
            g.setGraph({ rankdir: 'TB', nodesep: dynamicNodesep, ranksep: dynamicRanksep, marginx: 100, marginy: 100 });
            g.setDefaultEdgeLabel(() => ({}));

            const nodeWidth = 200; // Avg width with padding
            const nodeHeight = 80; // Avg height

            // Add nodes to dagre
            initialNodes.forEach(node => {
                let w = nodeWidth;
                let h = nodeHeight;
                if (node.id === 'project-root') { w = 240; h = 80; }
                g.setNode(node.id, { width: w, height: h });
            });

            // Add hierarchy edges to dagre
            generatedEdges.forEach(edge => {
                if (!edge.id.startsWith('dep-')) {
                    g.setEdge(edge.source, edge.target);
                }
            });

            // Execute Layout
            dagre.layout(g);

            // Calculate Visual Ranks to remove empty space
            const presentLevels = new Set<number>();
            initialNodes.forEach(node => {
                if (node.id === 'project-root') return;
                if (node.data.level !== undefined) {
                    presentLevels.add(node.data.level);
                } else {
                    const task = tasks.find(t => t._id === node.id);
                    if (task) presentLevels.add(task.level || 0);
                }
            });

            const sortedLevels = Array.from(presentLevels).sort((a, b) => a - b);
            const levelToRankMap = new Map<number, number>();
            sortedLevels.forEach((lvl, index) => {
                levelToRankMap.set(lvl, index);
            });

            // Apply computed positions to nodes
            initialNodes.forEach(node => {
                const n = g.node(node.id);
                let y = 0;

                if (node.id !== 'project-root') {
                    let rawLevel = 0;
                    if (node.data.level !== undefined) {
                        rawLevel = node.data.level;
                    } else {
                        const task = tasks.find(t => t._id === node.id);
                        if (task) rawLevel = task.level || 0;
                    }

                    const visualRank = levelToRankMap.get(rawLevel) || 0;
                    
                    // LEVEL_HEIGHT should match dynamicRanksep + card height (approx 80)
                    const LEVEL_HEIGHT = dynamicRanksep + 80; 
                    y = (visualRank + 1) * LEVEL_HEIGHT; 
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
            // Restriction Logic: Check if task is locked by dependencies
            const incompleteDependencies = (task.dependencies as (Task | string)[])?.filter?.(dep => {
                let depData: any = typeof dep === 'object' ? dep : null;
                if (!depData || !depData.status) {
                    const depId = (typeof dep === 'string' ? dep : (dep?._id || (dep as any)?.id))?.toString();
                    depData = tasks.find(t => t._id.toString() === depId);
                }
                const status = (depData?.status || '').toLowerCase();
                const progress = depData?.progress || 0;
                const isFinished = status === 'completed' || status === 'done' || progress >= 100;
                return !isFinished;
            }) || [];
            
            const isLocked = incompleteDependencies.length > 0;
            const assigneeId = (typeof task.assignedTo === 'string' 
                ? task.assignedTo 
                : (task.assignedTo as any)?._id || (task.assignedTo as any)?.id)?.toString();
            const isAssignedToMe = assigneeId === currentUserId?.toString();

            // Prevent opening if Locked AND not assigned to user AND not project creator
            if (isLocked && !isAssignedToMe && !isProjectCreator) {
                return;
            }

            setSelectedTask(task);
            setDetailsOpen(true);
        }
    };

    // Derive visible nodes and edges based on focused filters
    const { displayedNodes, displayedEdges } = useMemo(() => {
        // Handle Ancestry Path Filter
        if (focusedAncestryNodeId) {
            const ancestryPathIds = new Set<string>(['project-root']);
            const findAncestors = (currId: string) => {
                ancestryPathIds.add(currId);
                const task = tasks.find(t => t._id === currId);
                if (task && task.parentTask) {
                    const parentId = typeof task.parentTask === 'string' ? task.parentTask : task.parentTask._id;
                    findAncestors(parentId);
                }
            };
            findAncestors(focusedAncestryNodeId);

            const displayedEdges = edges.filter(e => 
                ancestryPathIds.has(e.source) && ancestryPathIds.has(e.target) && !e.id.startsWith('dep-')
            );

            const displayedNodes = nodes.map(n => ({
                ...n,
                style: {
                    ...n.style,
                    opacity: ancestryPathIds.has(n.id) ? 1 : 0.1,
                    transition: 'all 0.3s ease-in-out',
                },
            }));

            return { displayedNodes, displayedEdges };
        }

        // Handle Dependency Highlight Filter
        if (focusedDepNodeId) {
            // Find which nodes are coupled to the focused node
            const relatedDepEdges = edges.filter(
                e => e.id.startsWith('dep-') && (e.source === focusedDepNodeId || e.target === focusedDepNodeId)
            );
            const highlightedNodeIds = new Set<string>([focusedDepNodeId]);
            relatedDepEdges.forEach(e => {
                highlightedNodeIds.add(e.source);
                highlightedNodeIds.add(e.target);
            });

            const displayedEdges = [
                // Keep all non-dep edges as-is
                ...edges.filter(e => !e.id.startsWith('dep-')),
                // Only the dep edges connected to the focused node
                ...relatedDepEdges,
            ];

            const displayedNodes = nodes.map(n => ({
                ...n,
                style: {
                    ...n.style,
                    opacity: highlightedNodeIds.has(n.id) ? 1 : 0.2,
                    transition: 'opacity 0.2s',
                },
            }));

            return { displayedNodes, displayedEdges };
        }

        // Default: hide all dep edges, show all nodes normally
        return {
            displayedEdges: edges.filter(e => !e.id.startsWith('dep-')),
            displayedNodes: nodes,
        };
    }, [focusedDepNodeId, focusedAncestryNodeId, nodes, edges, tasks]);

    return (
        <div className="h-full w-full bg-slate-50 relative" onClick={() => {
            setFocusedDepNodeId(null);
            setFocusedAncestryNodeId(null);
        }}>
            <ReactFlow
                nodes={displayedNodes}
                edges={displayedEdges}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
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
                            <span className="text-slate-700">Coupled</span>
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
