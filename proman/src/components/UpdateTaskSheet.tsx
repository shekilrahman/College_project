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
import { updateTask, getTasks, getTaskById, deleteTask } from '@/api/tasks';
import { getUsers } from '@/api/users';
import { User, Task, Project } from '@/api/types';
import { Calendar, Link, Info, Target, Trash2, Save, AlertCircle } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';

interface UpdateTaskSheetProps {
    task: Task;
    project: Project;
    onTaskUpdated: () => void;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function UpdateTaskSheet({ task, project, onTaskUpdated, trigger, open: controlledOpen, onOpenChange }: UpdateTaskSheetProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? onOpenChange! : setInternalOpen;

    const [users, setUsers] = useState<User[]>([]);
    const [parentTask, setParentTask] = useState<Task | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Form state
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [status, setStatus] = useState(task.status);
    const [priority, setPriority] = useState(task.priority);
    const [assignedTo, setAssignedTo] = useState(typeof task.assignedTo === 'string' ? task.assignedTo : task.assignedTo?._id || '');
    const [toStartDate, setToStartDate] = useState<Date | undefined>(task.dates.toStartDate ? new Date(task.dates.toStartDate) : undefined);
    const [toCompleteDate, setToCompleteDate] = useState<Date | undefined>(task.dates.toCompleteDate ? new Date(task.dates.toCompleteDate) : undefined);
    const [weight, setWeight] = useState(task.weight?.toString() || '0');
    const [dependencies, setDependencies] = useState<string[]>(task.dependencies?.map((d: any) => typeof d === 'string' ? d : d._id) || []);
    const [availableTasks, setAvailableTasks] = useState<Task[]>([]);

    useEffect(() => {
        if (open) {
            fetchUsers();
            if (task.parentTask) fetchParentTask();
            fetchAvailableTasks();
            
            // Sync state with task prop
            setTitle(task.title);
            setDescription(task.description || '');
            setStatus(task.status);
            setPriority(task.priority);
            setAssignedTo(typeof task.assignedTo === 'string' ? task.assignedTo : task.assignedTo?._id || '');
            setToStartDate(task.dates.toStartDate ? new Date(task.dates.toStartDate) : undefined);
            setToCompleteDate(task.dates.toCompleteDate ? new Date(task.dates.toCompleteDate) : undefined);
            setWeight(task.weight?.toString() || '0');
            setDependencies(task.dependencies?.map((d: any) => typeof d === 'string' ? d : d._id) || []);
        }
    }, [open, task._id]);

    const fetchUsers = async () => {
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) { console.error(error); }
    };

    const fetchParentTask = async () => {
        const pid = typeof task.parentTask === 'string' ? task.parentTask : (task.parentTask as any)?._id;
        if (!pid) return;
        try {
            const parent = await getTaskById(pid);
            setParentTask(parent);
        } catch (error) { console.error(error); }
    };

    const fetchAvailableTasks = async () => {
        try {
            const tasks = await getTasks(project._id);
            // Filter out current task and its descendants to prevent circular deps
            setAvailableTasks(tasks.filter(t => t._id !== task._id));
        } catch (error) { console.error(error); }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await updateTask(task._id, {
                title,
                description,
                status,
                priority,
                assignedTo: assignedTo === 'unassigned' ? undefined : assignedTo,
                dates: {
                    toStartDate: toStartDate?.toISOString(),
                    toCompleteDate: toCompleteDate?.toISOString(),
                },
                weight: parseInt(weight),
                dependencies: dependencies.length > 0 ? dependencies : [],
            });
            toast.success('Task updated');
            setOpen(false);
            onTaskUpdated();
        } catch (error) {
            console.error("Update failed", error);
            toast.error('Update failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this task? All subtasks will also be deleted.')) return;
        setIsDeleting(true);
        try {
            await deleteTask(task._id);
            toast.success('Task deleted');
            setOpen(false);
            onTaskUpdated();
        } catch (error) {
            console.error("Delete failed", error);
            toast.error('Delete failed');
        } finally {
            setIsDeleting(false);
        }
    };

    // Date bounds logic
    const projectMinDate = project.startDate ? new Date(project.startDate) : undefined;
    const projectMaxDate = project.endDate ? new Date(project.endDate) : undefined;

    const minDate = parentTask?.dates?.toStartDate ? new Date(parentTask.dates.toStartDate) : projectMinDate;
    const maxDate = parentTask?.dates?.toCompleteDate ? new Date(parentTask.dates.toCompleteDate) : projectMaxDate;

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {trigger}
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-none sm:w-[1000px] overflow-y-auto bg-white border-l border-slate-200 p-0 flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    <SheetHeader className="space-y-1">
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <Target className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Task Specifications</span>
                        </div>
                        <SheetTitle className="text-3xl font-bold tracking-tight">
                            {title || 'Task Details'}
                        </SheetTitle>
                        <SheetDescription className="text-slate-500 text-base">
                            Edit configuration, timeline, and dependencies for this node.
                        </SheetDescription>
                    </SheetHeader>

                    <form onSubmit={handleUpdate} className="space-y-8">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-sm font-semibold text-slate-700">Task Label</Label>
                                <Input 
                                    id="title" 
                                    value={title} 
                                    onChange={(e) => setTitle(e.target.value)} 
                                    required 
                                    className="h-12 rounded-xl border-slate-200 bg-slate-50/30 text-lg font-medium focus-visible:ring-slate-900"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Status</Label>
                                    <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                                        <SelectTrigger className="h-11 rounded-xl border-slate-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Pending">Pending</SelectItem>
                                            <SelectItem value="In Progress">In Progress</SelectItem>
                                            <SelectItem value="Completed">Completed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Assignee</Label>
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
                                    <Label className="text-sm font-semibold text-slate-700">Priority</Label>
                                    <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                                        <SelectTrigger className="h-11 rounded-xl border-slate-200">
                                            <SelectValue />
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
                                <Label htmlFor="desc" className="text-sm font-semibold text-slate-700">Description</Label>
                                <Textarea 
                                    id="desc" 
                                    value={description} 
                                    onChange={(e) => setDescription(e.target.value)} 
                                    className="min-h-[120px] rounded-xl border-slate-200 bg-slate-50/30 resize-none p-4"
                                />
                            </div>

                            <div className="space-y-4 bg-slate-50/80 p-6 rounded-2xl border border-slate-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                        <Calendar className="h-4 w-4 text-slate-500" />
                                        Scheduling
                                    </div>
                                    {parentTask && (
                                        <Badge variant="outline" className="bg-white text-[10px] text-slate-400 border-slate-200">
                                            Constrained by Parent
                                        </Badge>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Start Date</Label>
                                        <DatePicker
                                            date={toStartDate}
                                            setDate={setToStartDate}
                                            minDate={minDate}
                                            maxDate={maxDate}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Due Date</Label>
                                        <DatePicker
                                            date={toCompleteDate}
                                            setDate={setToCompleteDate}
                                            minDate={minDate}
                                            maxDate={maxDate}
                                        />
                                    </div>
                                </div>
                                {(minDate || maxDate) && (
                                    <div className="flex items-start gap-2 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                                        <AlertCircle className="h-3.5 w-3.5 text-blue-500 mt-0.5" />
                                        <p className="text-[11px] text-blue-700 leading-relaxed">
                                            Valid range: <span className="font-bold">{minDate?.toLocaleDateString('en-GB')}</span> to <span className="font-bold">{maxDate?.toLocaleDateString('en-GB')}</span>
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                {task.parentTask && (
                                    <div className="space-y-2 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                                        <Label className="text-sm font-semibold flex items-center gap-2">
                                            <Target className="h-4 w-4 text-slate-500" />
                                            Contribution Weight
                                        </Label>
                                        <div className="flex items-center gap-3">
                                            <Input
                                                type="number"
                                                value={weight}
                                                onChange={(e) => setWeight(e.target.value)}
                                                className="h-10 rounded-lg border-slate-200 bg-white w-24"
                                            />
                                            <span className="text-xs text-slate-400 font-medium">% of parent</span>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3 col-span-2">
                                    <Label className="text-sm font-semibold flex items-center gap-2">
                                        <Link className="h-4 w-4 text-slate-500" />
                                        Network Dependencies
                                    </Label>
                                    <div className="border border-slate-100 rounded-2xl p-4 max-h-[160px] overflow-y-auto space-y-3 bg-slate-50/30">
                                        {availableTasks.length === 0 && <p className="text-xs text-slate-400 italic">No other tasks available for dependency</p>}
                                        {availableTasks.map(t => (
                                            <div key={t._id} className="flex items-center gap-3 group">
                                                <Checkbox
                                                    id={`dep-up-${t._id}`}
                                                    checked={dependencies.includes(t._id)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) setDependencies([...dependencies, t._id]);
                                                        else setDependencies(dependencies.filter(id => id !== t._id));
                                                    }}
                                                    className="data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900"
                                                />
                                                <label
                                                    htmlFor={`dep-up-${t._id}`}
                                                    className="text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors cursor-pointer flex-1"
                                                >
                                                    {t.title}
                                                </label>
                                                <Badge variant="outline" className="text-[9px] h-4 px-1 opacity-50">{t.status}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-8 border-t border-slate-100 bg-slate-50/30">
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="ghost" 
                            onClick={handleDelete} 
                            disabled={isDeleting}
                            className="h-12 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 gap-2 border border-transparent hover:border-red-100"
                        >
                            <Trash2 className="h-4 w-4" />
                            {isDeleting ? 'Deleting...' : 'Delete Task'}
                        </Button>
                        <div className="flex-1" />
                        <Button 
                            variant="ghost" 
                            onClick={() => setOpen(false)}
                            className="h-12 rounded-xl px-6"
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleUpdate} 
                            disabled={isSubmitting}
                            className="h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-8 font-bold shadow-lg shadow-slate-200"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {isSubmitting ? 'Syncing...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
