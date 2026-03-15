import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
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
import { User, TaskDates, Task } from '@/api/types';
import { Plus, Trash2, Calendar, Link } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";

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

interface CreateTaskDialogProps {
    onTaskCreated: () => void;
    projects: any[];
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

export function CreateTaskDialog({ onTaskCreated, projects, defaultProjectId, defaultParentId, parentTaskId, trigger, open: controlledOpen, onOpenChange }: CreateTaskDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? onOpenChange! : setInternalOpen;

    const [users, setUsers] = useState<User[]>([]);
    const [remainingWeight, setRemainingWeight] = useState(100);
    const [parentDates, setParentDates] = useState<TaskDates | null>(null);
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

    useEffect(() => {
        if (open) {
            fetchUsers();
            if (defaultProjectId) setProjectId(defaultProjectId);
            if (parentTaskId) {
                fetchRemainingWeight();
                fetchParentDates();
            } else {
                setParentDates(null);
            }
        }
    }, [open, defaultProjectId, parentTaskId]);

    useEffect(() => {
        if (open && projectId) {
            getTasks(projectId).then(tasks => {
                // Filter out the task itself if we were editing, but for create we just show all
                // For subtasks, maybe we shouldn't allow depending on parent, but let's keep it simple
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

    const fetchParentDates = async () => {
        if (!parentTaskId) return;
        try {
            const parent = await getTaskById(parentTaskId);
            setParentDates(parent.dates || null);
        } catch (error) {
            console.error('Failed to fetch parent dates:', error);
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
                    assignedDate: new Date().toISOString(), // Auto-generated
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
    const minDate = parentDates?.toStartDate ? new Date(parentDates.toStartDate) : undefined;
    const maxDate = parentDates?.toCompleteDate ? new Date(parentDates.toCompleteDate) : undefined;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : <Button variant="secondary">+ New Task</Button>}
            </DialogTrigger>
            <DialogContent className={`${multiMode ? 'sm:max-w-[800px]' : 'sm:max-w-[600px]'} max-h-[90vh] overflow-y-auto`}>
                <DialogHeader className="pb-4 border-b">
                    <DialogTitle className="text-xl font-bold">
                        {defaultParentId ? 'Create Subtask(s)' : 'Create Task'}
                    </DialogTitle>
                    {defaultParentId && (
                        <div className="flex items-center gap-2 pt-2">
                            <Button
                                type="button"
                                variant={!multiMode ? "default" : "outline"}
                                size="sm"
                                onClick={() => { setMultiMode(false); setSubtasks([]); }}
                            >
                                Single
                            </Button>
                            <Button
                                type="button"
                                variant={multiMode ? "default" : "outline"}
                                size="sm"
                                onClick={() => { setMultiMode(true); if (subtasks.length === 0) addSubtask(); }}
                            >
                                Multiple
                            </Button>
                        </div>
                    )}
                </DialogHeader>

                {!multiMode ? (
                    /* Single Task Form */
                    <form onSubmit={handleSubmitSingle} className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Task title" />
                            </div>
                            <div>
                                <Label>Project</Label>
                                <Select value={projectId} onValueChange={setProjectId} required disabled={!!defaultProjectId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Project" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {projects.map(p => (
                                            <SelectItem key={p._id} value={p._id}>{p.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Assign To</Label>
                                <Select value={assignedTo} onValueChange={setAssignedTo}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select User" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users.map(u => (
                                            <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-2">
                                <Label htmlFor="desc">Description</Label>
                                <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Task description (optional)" />
                            </div>
                            <div>
                                <Label>Priority</Label>
                                <Select value={priority} onValueChange={(v) => setPriority(v as 'Low' | 'Medium' | 'High')}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Low">Low</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="High">High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Dependencies Multi-Select (Simplified using checkboxes in a scrollable div for ease) */}
                            {availableTasks.length > 0 && (
                                <div className="col-span-2 space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Link className="h-4 w-4" />
                                        Dependencies (Tasks that must be completed first)
                                    </Label>
                                    <div className="border rounded-md p-3 max-h-[120px] overflow-y-auto space-y-2 bg-muted/20">
                                        {availableTasks.map(task => (
                                            <div key={task._id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`dep-${task._id}`}
                                                    checked={dependencies.includes(task._id)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setDependencies([...dependencies, task._id]);
                                                        } else {
                                                            setDependencies(dependencies.filter(id => id !== task._id));
                                                        }
                                                    }}
                                                />
                                                <label
                                                    htmlFor={`dep-${task._id}`}
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                >
                                                    {task.title} <span className="text-xs text-muted-foreground ml-2">({task.status})</span>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {defaultParentId && (
                                <div>
                                    <Label htmlFor="weight">
                                        Weight <span className="text-primary text-xs">({remainingWeight}% remaining)</span>
                                    </Label>
                                    <Input
                                        id="weight"
                                        type="number"
                                        min="0"
                                        max={remainingWeight}
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                        placeholder={`0-${remainingWeight}`}
                                        required
                                    />
                                </div>
                            )}
                        </div>

                        {/* Date Section */}
                        <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                Schedule
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs">Start Date</Label>
                                    <DatePicker
                                        date={toStartDate}
                                        setDate={setToStartDate}
                                        minDate={minDate}
                                        maxDate={maxDate}
                                        placeholder="Select start date"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Due Date</Label>
                                    <DatePicker
                                        date={toCompleteDate}
                                        setDate={setToCompleteDate}
                                        minDate={minDate}
                                        maxDate={maxDate}
                                        placeholder="Select due date"
                                    />
                                </div>
                            </div>
                            {parentDates && (parentDates.toStartDate || parentDates.toCompleteDate) && (
                                <p className="text-xs text-muted-foreground">
                                    Must be within: {parentDates.toStartDate ? new Date(parentDates.toStartDate).toLocaleDateString() : 'Any'} - {parentDates.toCompleteDate ? new Date(parentDates.toCompleteDate).toLocaleDateString() : 'Any'}
                                </p>
                            )}
                        </div>

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Create Task'}
                        </Button>
                    </form>
                ) : (
                    /* Multiple Subtasks Form */
                    <form onSubmit={handleSubmitMultiple} className="space-y-4 pt-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                                Total Weight: <span className={totalSubtaskWeight > remainingWeight ? 'text-red-500' : 'text-primary'}>{totalSubtaskWeight}%</span> / {remainingWeight}% remaining
                            </span>
                            <Button type="button" variant="outline" size="sm" onClick={addSubtask}>
                                <Plus className="h-4 w-4 mr-1" /> Add Subtask
                            </Button>
                        </div>

                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                            {subtasks.map((subtask, idx) => (
                                <div key={idx} className="p-4 border rounded-lg bg-muted/20 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-muted-foreground">Subtask {idx + 1}</span>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => removeSubtask(idx)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-4 gap-3">
                                        <div className="col-span-2">
                                            <Input
                                                placeholder="Title"
                                                value={subtask.title}
                                                onChange={(e) => updateSubtask(idx, 'title', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Select value={subtask.priority} onValueChange={(v) => updateSubtask(idx, 'priority', v)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Priority" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Low">Low</SelectItem>
                                                    <SelectItem value="Medium">Medium</SelectItem>
                                                    <SelectItem value="High">High</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Input
                                                type="number"
                                                placeholder="Weight %"
                                                min="0"
                                                value={subtask.weight}
                                                onChange={(e) => updateSubtask(idx, 'weight', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Select value={subtask.assignedTo} onValueChange={(v) => updateSubtask(idx, 'assignedTo', v)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Assign To" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {users.map(u => (
                                                        <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <DatePicker
                                                date={subtask.toStartDate}
                                                setDate={(d) => updateSubtask(idx, 'toStartDate', d)}
                                                minDate={minDate}
                                                maxDate={maxDate}
                                                placeholder="Start"
                                            />
                                        </div>
                                        <div>
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
                            ))}
                        </div>

                        {parentDates && (parentDates.toStartDate || parentDates.toCompleteDate) && (
                            <p className="text-xs text-muted-foreground">
                                Dates must be within: {parentDates.toStartDate ? new Date(parentDates.toStartDate).toLocaleDateString() : 'Any'} - {parentDates.toCompleteDate ? new Date(parentDates.toCompleteDate).toLocaleDateString() : 'Any'}
                            </p>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isSubmitting || subtasks.length === 0 || totalSubtaskWeight > remainingWeight}
                        >
                            {isSubmitting ? 'Creating...' : `Create ${subtasks.length} Subtask(s)`}
                        </Button>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
