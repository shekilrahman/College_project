import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetDescription,
} from '@/components/ui/sheet';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { DatePicker } from '@/components/ui/date-picker';
import { createTask, createBulkTasks, getTasks, getTaskById } from '@/api/tasks';
import { getUsers } from '@/api/users';
import { User, TaskDates, Task, Project } from '@/api/types';
import { Plus, Trash2, Calendar, Link, Info, Layers, Target } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface SubtaskFormData {
    title: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High';
    assignedTo: string;
    toStartDate?: Date;
    toCompleteDate?: Date;
    weight: string;
    dependencies: string[];
}

interface CreateTaskSheetProps {
    onTaskCreated: () => void;
    projects: Project[];
    defaultProjectId?: string;
    defaultParentId?: string;
    parentTaskId?: string;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

const emptySubtask = (): SubtaskFormData => ({
    title: '',
    description: '',
    priority: 'Medium',
    assignedTo: '',
    toStartDate: undefined,
    toCompleteDate: undefined,
    weight: '0',
    dependencies: [],
});

export function CreateTaskSheet({ onTaskCreated, projects, defaultProjectId, defaultParentId, parentTaskId, trigger, open: controlledOpen, onOpenChange }: CreateTaskSheetProps) {
    const [internalOpen, setInternalOpen] = useState(false);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? onOpenChange! : setInternalOpen;

    const [users, setUsers] = useState<User[]>([]);
    const [remainingWeight, setRemainingWeight] = useState(100);
    const [parentTask, setParentTask] = useState<Task | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Single task mode form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
    const [assignedTo, setAssignedTo] = useState('');
    const [projectId, setProjectId] = useState(defaultProjectId || '');
    const [toStartDate, setToStartDate] = useState<Date | undefined>();
    const [toCompleteDate, setToCompleteDate] = useState<Date | undefined>();
    const [weight, setWeight] = useState('0');
    const [dependencies, setDependencies] = useState<string[]>([]);
    const [availableTasks, setAvailableTasks] = useState<Task[]>([]);

    // Multiple subtasks mode
    const [subtasks, setSubtasks] = useState<SubtaskFormData[]>([]);
    const [multiMode, setMultiMode] = useState(false);

    const currentProject = projects.find(p => p._id === projectId);

    useEffect(() => {
        if (open) {
            fetchUsers();
            if (defaultProjectId) setProjectId(defaultProjectId);
            if (parentTaskId) {
                fetchRemainingWeight();
                fetchParentTask();
            } else {
                setParentTask(null);
            }
        }
    }, [open, defaultProjectId, parentTaskId]);

    useEffect(() => {
        if (open && projectId) {
            getTasks(projectId).then(tasks => {
                setAvailableTasks(tasks);
            }).catch(console.error);
        } else {
            setAvailableTasks([]);
        }
    }, [open, projectId]);

    const fetchUsers = async () => {
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) { console.error(error); }
    };

    const fetchParentTask = async () => {
        if (!parentTaskId) return;
        try {
            const parent = await getTaskById(parentTaskId);
            setParentTask(parent);
        } catch (error) {
            console.error('Failed to fetch parent task:', error);
        }
    };

    const fetchRemainingWeight = async () => {
        try {
            const data = await getTasks(undefined, parentTaskId);
            const totalUsed = data.reduce((sum: number, task: any) => sum + (task.weight || 0), 0);
            setRemainingWeight(100 - totalUsed);
        } catch (error) {
            console.error(error);
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setPriority('Medium');
        setAssignedTo('');
        if (!defaultProjectId) setProjectId('');
        setToStartDate(undefined);
        setToCompleteDate(undefined);
        setWeight('0');
        setDependencies([]);
        setSubtasks([]);
        setMultiMode(false);
    };

    const handleSubmitSingle = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await createTask({
                title,
                description,
                priority,
                assignedTo: assignedTo || undefined,
                project: projectId,
                parentTask: defaultParentId || undefined,
                dates: {
                    assignedDate: new Date().toISOString(),
                    toStartDate: toStartDate?.toISOString(),
                    toCompleteDate: toCompleteDate?.toISOString(),
                },
                weight: defaultParentId ? parseInt(weight) : 0,
                dependencies: dependencies.length > 0 ? dependencies : undefined,
            });
            setOpen(false);
            resetForm();
            onTaskCreated();
        } catch (error) {
            console.error("Failed to create task", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitMultiple = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await createBulkTasks({
                project: projectId,
                parentTask: defaultParentId,
                tasks: subtasks.map(subtask => ({
                    title: subtask.title,
                    description: subtask.description,
                    priority: subtask.priority,
                    assignedTo: subtask.assignedTo || undefined,
                    dates: {
                        assignedDate: new Date().toISOString(),
                        toStartDate: subtask.toStartDate?.toISOString(),
                        toCompleteDate: subtask.toCompleteDate?.toISOString(),
                    },
                    weight: parseInt(subtask.weight) || 0,
                })),
            });
            setOpen(false);
            resetForm();
            onTaskCreated();
        } catch (error) {
            console.error("Failed to create subtasks", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const addSubtask = () => {
        setSubtasks([...subtasks, emptySubtask()]);
    };

    const removeSubtask = (index: number) => {
        setSubtasks(subtasks.filter((_, i) => i !== index));
    };

    const updateSubtask = (index: number, field: keyof SubtaskFormData, value: any) => {
        const updated = [...subtasks];
        updated[index] = { ...updated[index], [field]: value };
        setSubtasks(updated);
    };

    const totalSubtaskWeight = subtasks.reduce((sum, s) => sum + (parseInt(s.weight) || 0), 0);
    
    // Date bounds logic
    const projectMinDate = currentProject?.startDate ? new Date(currentProject.startDate) : undefined;
    const projectMaxDate = currentProject?.endDate ? new Date(currentProject.endDate) : undefined;

    const minDate = parentTask?.dates?.toStartDate ? new Date(parentTask.dates.toStartDate) : projectMinDate;
    const maxDate = parentTask?.dates?.toCompleteDate ? new Date(parentTask.dates.toCompleteDate) : projectMaxDate;

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            {trigger !== null && (
                <SheetTrigger asChild>
                    {trigger ? trigger : <Button variant="secondary">+ New Task</Button>}
                </SheetTrigger>
            )}
            <SheetContent side="right" className="w-full sm:max-w-[850px] overflow-y-auto bg-white border-l border-slate-200 p-0 flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <SheetHeader className="space-y-1">
                        <SheetTitle className="text-2xl font-bold tracking-tight">
                            {defaultParentId ? 'Create Subtask' : 'Create Task'}
                        </SheetTitle>
                        <SheetDescription className="text-slate-500">
                            {defaultParentId ? `Adding subtasks to: ${parentTask?.title || '...'}` : 'Define the details for your new project task.'}
                        </SheetDescription>
                    </SheetHeader>

                    {defaultParentId && (
                        <div className="bg-slate-50 p-1 rounded-lg inline-flex gap-1 border border-slate-200">
                            <Button
                                type="button"
                                variant={!multiMode ? "default" : "ghost"}
                                size="sm"
                                className={`rounded-md px-4 ${!multiMode ? 'bg-white shadow-sm hover:bg-white text-slate-900 border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
                                onClick={() => { setMultiMode(false); setSubtasks([]); }}
                            >
                                Single
                            </Button>
                            <Button
                                type="button"
                                variant={multiMode ? "default" : "ghost"}
                                size="sm"
                                className={`rounded-md px-4 ${multiMode ? 'bg-white shadow-sm hover:bg-white text-slate-900 border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
                                onClick={() => { setMultiMode(true); if (subtasks.length === 0) addSubtask(); }}
                            >
                                Multiple
                            </Button>
                        </div>
                    )}

                    {!multiMode ? (
                        <form onSubmit={handleSubmitSingle} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="text-sm font-semibold">Task Title</Label>
                                    <Input 
                                        id="title" 
                                        value={title} 
                                        onChange={(e) => setTitle(e.target.value)} 
                                        required 
                                        placeholder="e.g., Design System Update" 
                                        className="h-11 rounded-xl border-slate-200 focus:ring-slate-900 focus:border-slate-900 transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold">Assignee</Label>
                                        <Select value={assignedTo} onValueChange={setAssignedTo}>
                                            <SelectTrigger className="h-11 rounded-xl border-slate-200">
                                                <SelectValue placeholder="Unassigned" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                                {users.map(u => (
                                                    <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold">Priority</Label>
                                        <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                                            <SelectTrigger className="h-11 rounded-xl border-slate-200">
                                                <SelectValue placeholder="Medium" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Low"><Badge variant="outline" className="bg-slate-50">Low</Badge></SelectItem>
                                                <SelectItem value="Medium"><Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">Medium</Badge></SelectItem>
                                                <SelectItem value="High"><Badge variant="outline" className="bg-red-50 text-red-700 border-red-100">High</Badge></SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="desc" className="text-sm font-semibold">Description</Label>
                                    <Textarea 
                                        id="desc" 
                                        value={description} 
                                        onChange={(e) => setDescription(e.target.value)} 
                                        placeholder="Add more context about this task..." 
                                        className="min-h-[100px] rounded-xl border-slate-200 resize-none"
                                    />
                                </div>

                                <div className="h-px bg-slate-100 my-4" />

                                <div className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                                        <Calendar className="h-4 w-4 text-slate-500" />
                                        Task Timeline
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] uppercase font-bold text-slate-400">Start Date</Label>
                                            <DatePicker
                                                date={toStartDate}
                                                setDate={setToStartDate}
                                                minDate={minDate}
                                                maxDate={maxDate}
                                                placeholder="Select start"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] uppercase font-bold text-slate-400">Due Date</Label>
                                            <DatePicker
                                                date={toCompleteDate}
                                                setDate={setToCompleteDate}
                                                minDate={minDate}
                                                maxDate={maxDate}
                                                placeholder="Select due"
                                            />
                                        </div>
                                    </div>
                                    {(minDate || maxDate) && (
                                        <div className="flex items-start gap-2 p-2 bg-blue-50/50 rounded-lg border border-blue-100">
                                            <Info className="h-3.5 w-3.5 text-blue-500 mt-0.5" />
                                            <p className="text-[11px] text-blue-700 leading-relaxed">
                                                Dates are restricted to {defaultParentId ? 'parent task' : 'project'} duration: 
                                                <span className="font-bold ml-1">
                                                    {minDate?.toLocaleDateString('en-GB')} - {maxDate?.toLocaleDateString('en-GB')}
                                                </span>
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {defaultParentId && (
                                    <div className="space-y-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <Label className="text-sm font-semibold flex items-center gap-2">
                                                <Target className="h-4 w-4 text-slate-500" />
                                                Task Weight
                                            </Label>
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-bold">
                                                {remainingWeight}% Available
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Input
                                                id="weight"
                                                type="number"
                                                min="0"
                                                max={remainingWeight}
                                                value={weight}
                                                onChange={(e) => setWeight(e.target.value)}
                                                className="h-11 rounded-xl border-slate-200"
                                                required
                                            />
                                            <span className="text-sm font-medium text-slate-400">% contribution to parent</span>
                                        </div>
                                    </div>
                                )}

                                {availableTasks.length > 0 && (
                                    <div className="space-y-3">
                                        <Label className="text-sm font-semibold flex items-center gap-2">
                                            <Link className="h-4 w-4 text-slate-500" />
                                            Dependencies
                                        </Label>
                                        <div className="border border-slate-100 rounded-2xl p-4 max-h-[160px] overflow-y-auto space-y-3 bg-slate-50/30">
                                            {availableTasks.map(task => (
                                                <div key={task._id} className="flex items-center gap-3 group">
                                                    <Checkbox
                                                        id={`dep-${task._id}`}
                                                        checked={dependencies.includes(task._id)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) setDependencies([...dependencies, task._id]);
                                                            else setDependencies(dependencies.filter(id => id !== task._id));
                                                        }}
                                                        className="data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900"
                                                    />
                                                    <label
                                                        htmlFor={`dep-${task._id}`}
                                                        className="text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors cursor-pointer"
                                                    >
                                                        {task.title}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleSubmitMultiple} className="space-y-6">
                            <div className="flex items-center justify-between sticky top-0 bg-white z-10 py-2 border-b border-slate-50">
                                <div className="space-y-0.5">
                                    <div className="text-sm font-bold text-slate-900">Subtask Queue</div>
                                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                                        Weight: <span className={totalSubtaskWeight > remainingWeight ? 'text-red-500' : 'text-blue-600'}>{totalSubtaskWeight}%</span> / {remainingWeight}% limit
                                    </div>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={addSubtask} className="rounded-full h-8 px-3 border-slate-200">
                                    <Plus className="h-3 w-3 mr-1" /> Add
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {subtasks.map((subtask, idx) => (
                                    <div key={idx} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/30 space-y-4 relative group">
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => removeSubtask(idx)}
                                            className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-white border border-slate-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                        </Button>
                                        
                                        <div className="space-y-3">
                                            <Input
                                                placeholder="Subtask title"
                                                value={subtask.title}
                                                onChange={(e) => updateSubtask(idx, 'title', e.target.value)}
                                                required
                                                className="border-none bg-transparent font-bold text-slate-900 placeholder:text-slate-300 focus-visible:ring-0 h-auto p-0 text-base"
                                            />
                                            
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <Label className="text-[9px] uppercase font-bold text-slate-400">Assignee</Label>
                                                    <Select value={subtask.assignedTo} onValueChange={(v) => updateSubtask(idx, 'assignedTo', v)}>
                                                        <SelectTrigger className="h-9 rounded-lg border-slate-100 bg-white">
                                                            <SelectValue placeholder="Unassigned" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="unassigned">Unassigned</SelectItem>
                                                            {users.map(u => (
                                                                <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[9px] uppercase font-bold text-slate-400">Weight %</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        min="0"
                                                        value={subtask.weight}
                                                        onChange={(e) => updateSubtask(idx, 'weight', e.target.value)}
                                                        className="h-9 rounded-lg border-slate-100 bg-white"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <Label className="text-[9px] uppercase font-bold text-slate-400">Start Date</Label>
                                                    <DatePicker
                                                        date={subtask.toStartDate}
                                                        setDate={(d) => updateSubtask(idx, 'toStartDate', d)}
                                                        minDate={minDate}
                                                        maxDate={maxDate}
                                                        placeholder="Start"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[9px] uppercase font-bold text-slate-400">Due Date</Label>
                                                    <DatePicker
                                                        date={subtask.toCompleteDate}
                                                        setDate={(d) => updateSubtask(idx, 'toCompleteDate', d)}
                                                        minDate={minDate}
                                                        maxDate={maxDate}
                                                        placeholder="Due"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </form>
                    )}
                </div>

                <div className="p-6 border-t border-slate-50 bg-slate-50/30">
                    {!multiMode ? (
                        <Button 
                            onClick={handleSubmitSingle} 
                            className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg shadow-slate-200 transition-all" 
                            disabled={isSubmitting || !title || !projectId}
                        >
                            {isSubmitting ? 'Finalizing...' : 'Create Task'}
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmitMultiple}
                            className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg shadow-slate-200 transition-all"
                            disabled={isSubmitting || subtasks.length === 0 || totalSubtaskWeight > remainingWeight}
                        >
                            {isSubmitting ? 'Finalizing...' : `Create ${subtasks.length} Subtask(s)`}
                        </Button>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
