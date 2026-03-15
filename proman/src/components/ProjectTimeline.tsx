import { useMemo, useState, useRef, useEffect } from 'react';
import { format, differenceInDays, addDays, eachDayOfInterval, isToday, isWeekend, startOfWeek, endOfWeek } from 'date-fns';
import { Task, Project } from '@/api/types';
import { TaskDetailDialog } from './TaskDetailDialog';
import { cn } from '@/lib/utils';
// import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar as CalendarIcon } from 'lucide-react';

interface ProjectTimelineProps {
    project: Project;
    tasks: Task[];
    onAddSubtask?: (taskId: string) => void;
    currentUserId?: string;
    isProjectCreator?: boolean;
    onTaskUpdated?: () => void;
}

interface TimelineTask extends Task {
    children: TimelineTask[];
    depth: number;
}

const DAY_WIDTH = 56; // Wider columns for better breathing room
const PARENT_HEADER_HEIGHT = 44;
const SUBTASK_ROW_HEIGHT = 32;
const ROW_PADDING = 12;

export function ProjectTimeline({
    project,
    tasks,
    onAddSubtask,
    currentUserId,
    isProjectCreator: _isProjectCreator = false,
    onTaskUpdated
}: ProjectTimelineProps) {
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);

    // Sync scrolling
    useEffect(() => {
        const handleScroll = (e: Event) => {
            const target = e.target as HTMLDivElement;
            if (target === scrollRef.current && sidebarRef.current) {
                sidebarRef.current.scrollTop = target.scrollTop;
            }
        };
        const scrollEl = scrollRef.current;
        scrollEl?.addEventListener('scroll', handleScroll);
        return () => scrollEl?.removeEventListener('scroll', handleScroll);
    }, []);

    // Build hierarchical task tree and date range
    const { taskTree, days, dateRange } = useMemo(() => {
        const projectStart = new Date(project.startDate);
        const projectEnd = new Date(project.endDate);

        let minDate = projectStart;
        let maxDate = projectEnd;

        tasks.forEach(task => {
            const taskStart = task.dates?.toStartDate ? new Date(task.dates.toStartDate) : new Date(task.createdAt);
            const taskEnd = task.dates?.toCompleteDate ? new Date(task.dates.toCompleteDate) : taskStart;

            if (taskStart < minDate) minDate = taskStart;
            if (taskEnd > maxDate) maxDate = taskEnd;
        });

        minDate = addDays(startOfWeek(minDate), -1);
        maxDate = addDays(endOfWeek(maxDate), 14); // Extra 2 weeks at end

        const days = eachDayOfInterval({ start: minDate, end: maxDate });

        const taskMap = new Map<string, TimelineTask>();
        const rootTasks: TimelineTask[] = [];

        tasks.forEach(task => {
            taskMap.set(task._id, { ...task, children: [], depth: 0 });
        });

        tasks.forEach(task => {
            const timelineTask = taskMap.get(task._id)!;
            if (task.parentTask) {
                const parentId = typeof task.parentTask === 'string' ? task.parentTask : task.parentTask._id;
                const parent = taskMap.get(parentId);
                if (parent) {
                    parent.children.push(timelineTask);
                    timelineTask.depth = parent.depth + 1;
                } else {
                    rootTasks.push(timelineTask);
                }
            } else {
                rootTasks.push(timelineTask);
            }
        });

        // Calculate heights upfront used by both sidebar and timeline
        const calculateHeight = (task: TimelineTask) => {
            if (task.children.length === 0) return PARENT_HEADER_HEIGHT + ROW_PADDING;
            return PARENT_HEADER_HEIGHT + (task.children.length * SUBTASK_ROW_HEIGHT) + ROW_PADDING + 8;
        };

        return {
            taskTree: rootTasks.map(t => ({ ...t, _height: calculateHeight(t) })),
            days,
            dateRange: { start: minDate, end: maxDate }
        };
    }, [project, tasks]);

    const getDayIndex = (date: Date) => differenceInDays(date, dateRange.start);
    const getXPosition = (date: Date) => Math.max(0, getDayIndex(date) * DAY_WIDTH);
    const getWidth = (start: Date, end: Date) => {
        const diff = differenceInDays(end, start) + 1;
        return Math.max(DAY_WIDTH, diff * DAY_WIDTH);
    };

    const handleTaskClick = (task: Task, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedTask(task);
        setDetailsOpen(true);
    };

    const isLeafTask = (task: Task) => !tasks.some(t => {
        const parentId = typeof t.parentTask === 'string' ? t.parentTask : t.parentTask?._id;
        return parentId === task._id;
    });

    const canUpdateProgressForTask = (task: Task) => (
        (typeof task.assignedTo !== 'string' && task.assignedTo?._id === currentUserId) ||
        (typeof task.createdBy !== 'string' && task.createdBy?._id === currentUserId)
    );

    const totalTimelineWidth = days.length * DAY_WIDTH;
    const todayIndex = getDayIndex(new Date());

    return (
        <TooltipProvider>
            <div className="h-full w-full bg-white flex flex-col overflow-hidden font-sans text-slate-900 border-t">
                {/* Header Layer */}
                <div className="flex border-b bg-white z-30 shadow-sm relative sticky top-0">
                    {/* Sidebar Header */}
                    <div className="w-80 flex-shrink-0 px-6 py-3 border-r bg-slate-50/50 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tasks</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                {tasks.length} items
                            </span>
                        </div>
                    </div>
                    {/* Timeline Header (Months) */}
                    <div className="flex-1 overflow-hidden relative" ref={(el) => {
                        if (el && scrollRef.current) {
                            // Sync horizontal scroll for header
                            scrollRef.current.addEventListener('scroll', () => {
                                el.scrollLeft = scrollRef.current!.scrollLeft;
                            });
                        }
                    }}>
                        <div className="h-10 flex relative border-b" style={{ width: totalTimelineWidth }}>
                            {days.map((day, idx) => {
                                if (day.getDate() !== 1 && idx !== 0) return null;
                                let span = 0;
                                for (let i = idx; i < days.length; i++) {
                                    if (i > idx && days[i].getDate() === 1) break;
                                    span++;
                                }
                                return (
                                    <div
                                        key={`month-${idx}`}
                                        className="absolute top-0 h-full flex items-center px-4 text-xs font-semibold text-slate-500 sticky left-0 uppercase tracking-wider bg-white/50 backdrop-blur-sm"
                                        style={{ left: idx * DAY_WIDTH, width: span * DAY_WIDTH }}
                                    >
                                        {format(day, 'MMMM yyyy')}
                                    </div>
                                );
                            })}
                        </div>
                        {/* Days Row */}
                        <div className="h-9 flex" style={{ width: totalTimelineWidth }}>
                            {days.map((day, idx) => {
                                const isWknd = isWeekend(day);
                                return (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "flex-shrink-0 flex items-center justify-center text-[10px] font-medium border-r border-slate-100/50",
                                            isToday(day) ? "bg-blue-50 text-blue-600" :
                                                isWknd ? "bg-slate-50/50 text-slate-400" : "text-slate-500"
                                        )}
                                        style={{ width: DAY_WIDTH }}
                                    >
                                        <div className="flex flex-col items-center">
                                            <span className="opacity-60 text-[9px] uppercase">{format(day, 'EEE')}</span>
                                            <span className={cn("text-xs", isToday(day) && "font-bold")}>{format(day, 'd')}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Body Layer */}
                <div className="flex-1 overflow-hidden flex relative bg-slate-50/30">
                    {/* Sidebar Body */}
                    <div className="w-80 flex-shrink-0 bg-white border-r overflow-hidden" ref={sidebarRef}>
                        <div className="pb-20">
                            {taskTree.map((task: any) => (
                                <div
                                    key={task._id}
                                    className="px-6 border-b border-slate-100 flex flex-col py-4 hover:bg-slate-50/50 transition-colors group cursor-pointer relative"
                                    style={{ height: task._height }}
                                    onClick={(e) => handleTaskClick(task, e)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={cn("mt-1 w-2 h-2 rounded-sm flex-shrink-0",
                                            task.progress >= 100 ? "bg-emerald-500" :
                                                task.progress > 0 ? "bg-blue-500" : "bg-slate-300"
                                        )} />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-slate-800 leading-tight line-clamp-2">{task.title}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                                                    {task.children.length} subtasks
                                                </span>
                                                {task.dates?.toCompleteDate && (
                                                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                                        <CalendarIcon className="w-3 h-3" />
                                                        <span>{format(new Date(task.dates.toCompleteDate), 'MMM d')}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Subtask list in sidebar */}
                                    {task.children.length > 0 && (
                                        <div className="mt-auto pt-2 pl-5 space-y-2 border-l border-slate-100 ml-1">
                                            {task.children.map((child: Task) => (
                                                <div key={child._id} className="text-xs text-slate-500 truncate h-[24px] flex items-center hover:text-slate-800 transition-colors">
                                                    {child.title}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Timeline Body */}
                    <div className="flex-1 overflow-auto relative" ref={scrollRef}>
                        <div style={{ width: totalTimelineWidth, minHeight: '100%' }}>
                            {/* Full Height Grid Background */}
                            <div className="absolute inset-0 pointer-events-none z-0 flex">
                                {days.map((day, idx) => (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "h-full border-r border-slate-100/60 flex-shrink-0",
                                            isWeekend(day) && "bg-slate-50/40 pattern-diagonal-lines"
                                        )}
                                        style={{ width: DAY_WIDTH }}
                                    />
                                ))}
                            </div>

                            {/* Today Marker */}
                            {todayIndex >= 0 && (
                                <div
                                    className="absolute top-0 bottom-0 w-[2px] bg-blue-500 z-10 pointer-events-none shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                                    style={{ left: (todayIndex * DAY_WIDTH) + (DAY_WIDTH / 2) }}
                                />
                            )}

                            {/* Task Rows */}
                            <div className="pb-20 relative z-10">
                                {taskTree.map((task: any) => {
                                    const taskStart = task.dates?.toStartDate ? new Date(task.dates.toStartDate) : new Date(task.createdAt);
                                    const taskEnd = task.dates?.toCompleteDate ? new Date(task.dates.toCompleteDate) : addDays(taskStart, 1);
                                    const startX = getXPosition(taskStart);
                                    const width = getWidth(taskStart, taskEnd);

                                    return (
                                        <div
                                            key={task._id}
                                            className="relative border-b border-transparent hover:bg-slate-50/30 transition-colors"
                                            style={{ height: task._height }}
                                        >
                                            {/* Parent Card Container */}
                                            <div
                                                className="absolute rounded-lg border border-slate-200/60 bg-white/60 shadow-sm backdrop-blur-[2px] overflow-hidden group hover:border-blue-300 hover:shadow-md transition-all duration-300"
                                                style={{
                                                    left: startX,
                                                    width: Math.max(width, DAY_WIDTH),
                                                    height: task._height - ROW_PADDING,
                                                    top: ROW_PADDING / 2
                                                }}
                                                onClick={(e) => handleTaskClick(task, e)}
                                            >
                                                {/* Header Bar */}
                                                <div className="h-[44px] px-3 flex items-center justify-between bg-gradient-to-r from-slate-50/80 to-transparent">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn("w-1.5 h-full absolute left-0 top-0 bottom-0",
                                                            task.progress >= 100 ? "bg-emerald-500" : "bg-blue-500"
                                                        )} />
                                                        <span className="text-xs font-bold text-slate-700 ml-1">{task.title}</span>
                                                    </div>

                                                    {/* Progress Pill */}
                                                    <div className="bg-white border rounded-full px-2 py-0.5 shadow-sm text-[10px] font-medium text-slate-600 flex items-center gap-1.5">
                                                        <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={cn("h-full rounded-full transition-all duration-500",
                                                                    task.progress >= 100 ? "bg-emerald-500" : "bg-blue-500"
                                                                )}
                                                                style={{ width: `${task.progress || 0}%` }}
                                                            />
                                                        </div>
                                                        <span>{task.progress || 0}%</span>
                                                    </div>
                                                </div>

                                                {/* Subtasks Container */}
                                                <div className="relative pt-1">
                                                    {task.children.map((child: Task, cIdx: number) => {
                                                        const childStart = child.dates?.toStartDate ? new Date(child.dates.toStartDate) : new Date(child.createdAt);
                                                        const childEnd = child.dates?.toCompleteDate ? new Date(child.dates.toCompleteDate) : addDays(childStart, 1);

                                                        const childGlobalStart = getDayIndex(childStart);
                                                        const parentGlobalStart = getDayIndex(taskStart);
                                                        const offsetDays = childGlobalStart - parentGlobalStart;

                                                        const childLeft = offsetDays * DAY_WIDTH;
                                                        const childWidth = getWidth(childStart, childEnd);

                                                        const statusColor = child.progress >= 100 ? "bg-emerald-500" :
                                                            child.progress > 0 ? "bg-blue-500" : "bg-slate-400";

                                                        return (
                                                            <Tooltip key={child._id}>
                                                                <TooltipTrigger asChild>
                                                                    <div
                                                                        className={cn(
                                                                            "absolute h-[26px] rounded shadow-sm cursor-pointer hover:ring-2 ring-blue-200/50 hover:z-10 transition-all flex items-center px-2",
                                                                            statusColor
                                                                        )}
                                                                        style={{
                                                                            top: (cIdx * SUBTASK_ROW_HEIGHT),
                                                                            left: Math.max(4, childLeft),
                                                                            width: Math.max(childWidth, 40)
                                                                        }}
                                                                        onClick={(e) => handleTaskClick(child, e)}
                                                                    >
                                                                        <span className="text-[10px] font-medium text-white truncate drop-shadow-sm">
                                                                            {child.title}
                                                                        </span>
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top">
                                                                    <div className="text-xs">
                                                                        <p className="font-bold mb-1">{child.title}</p>
                                                                        <p className="text-slate-400">
                                                                            {format(childStart, 'MMM d')} - {format(childEnd, 'MMM d')}
                                                                        </p>
                                                                    </div>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <TaskDetailDialog
                    task={selectedTask}
                    open={detailsOpen}
                    onOpenChange={setDetailsOpen}
                    onAddSubtask={onAddSubtask}
                    isLeafTask={selectedTask ? isLeafTask(selectedTask) : false}
                    canUpdateProgress={selectedTask ? canUpdateProgressForTask(selectedTask) : false}
                    onTaskUpdated={onTaskUpdated}
                />
            </div>
        </TooltipProvider>
    );
}
