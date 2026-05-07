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
    SheetFooter,
} from '@/components/ui/sheet';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { DatePicker } from '@/components/ui/date-picker';
import { updateProject } from '@/api/projects';
import { getUsers } from '@/api/users';
import { Project, User } from '@/api/types';
import { Settings2, Save, Info, Calendar, Users, Search, Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface UpdateProjectSheetProps {
    project: Project;
    onProjectUpdated: () => void;
    trigger?: React.ReactNode;
}

export function UpdateProjectSheet({ project, onProjectUpdated, trigger }: UpdateProjectSheetProps) {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState(project.title);
    const [description, setDescription] = useState(project.description || '');
    const [status, setStatus] = useState(project.status);
    const [startDate, setStartDate] = useState<Date | undefined>(new Date(project.startDate));
    const [endDate, setEndDate] = useState<Date | undefined>(new Date(project.endDate));
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            setTitle(project.title);
            setDescription(project.description || '');
            setStatus(project.status);
            setStartDate(new Date(project.startDate));
            setEndDate(new Date(project.endDate));
            setSelectedMembers(project.members?.map((m: any) => typeof m === 'string' ? m : m._id) || []);
            fetchUsers();
        }
    }, [open, project._id]);

    const fetchUsers = async () => {
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        }
    };

    const toggleMember = (userId: string) => {
        setSelectedMembers(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId) 
                : [...prev, userId]
        );
    };

    const getSelectedUserObjects = () => {
        return selectedMembers.map(id => users.find(u => u._id === id)).filter(Boolean) as User[];
    };

    const filteredUsers = users.filter(u => 
        !selectedMembers.includes(u._id) &&
        (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        
        try {
            if (!startDate || !endDate) return;
            setIsSubmitting(true);

            await updateProject(project._id, {
                title,
                description,
                status,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                members: selectedMembers,
            });
            
            toast.success('Project updated successfully');
            setOpen(false);
            onProjectUpdated();
        } catch (error) {
            console.error("Failed to update project", error);
            toast.error('Failed to update project');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {trigger ? trigger : (
                    <Button variant="outline" size="sm" className="gap-2 border-slate-200">
                        <Settings2 className="h-4 w-4" />
                        Edit Project
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-none sm:w-[1000px] flex flex-col h-full border-l border-slate-200 bg-white p-0">
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    <SheetHeader className="space-y-1">
                        <div className="flex items-center gap-2 text-slate-900 mb-1">
                            <Settings2 className="h-5 w-5 text-indigo-600" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Project Configuration</span>
                        </div>
                        <SheetTitle className="text-3xl font-black tracking-tight text-slate-900">Project Settings</SheetTitle>
                        <SheetDescription className="text-slate-500 text-base">
                            Modify core project parameters, status, and team members.
                        </SheetDescription>
                    </SheetHeader>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="text-sm font-semibold text-slate-700">Project Title</Label>
                                    <Input 
                                        id="title" 
                                        value={title} 
                                        onChange={(e) => setTitle(e.target.value)} 
                                        required 
                                        className="h-12 rounded-xl border-slate-200 bg-slate-50/30 focus-visible:ring-indigo-500/20 font-bold"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Operational Status</Label>
                                    <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                                        <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50/30">
                                            <SelectValue placeholder="Select Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Planned">Planned</SelectItem>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="On Hold">On Hold</SelectItem>
                                            <SelectItem value="Completed">Completed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-sm font-semibold text-slate-700">Scope Description</Label>
                                    <Textarea 
                                        id="description" 
                                        value={description} 
                                        onChange={(e) => setDescription(e.target.value)} 
                                        className="min-h-[140px] rounded-xl border-slate-200 bg-slate-50/30 focus-visible:ring-indigo-500/20 resize-none p-4"
                                    />
                                </div>

                                <div className="space-y-4 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                        <Calendar className="h-4 w-4 text-slate-500" />
                                        Lifecycle Timeline
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Start Date</Label>
                                            <DatePicker date={startDate} setDate={setStartDate} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Target End</Label>
                                            <DatePicker date={endDate} setDate={setEndDate} />
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2 p-3 bg-amber-50/50 rounded-xl border border-amber-100 mt-2">
                                        <Info className="h-3.5 w-3.5 text-amber-500 mt-0.5" />
                                        <p className="text-[11px] text-amber-700 leading-relaxed">
                                            <span className="font-bold">Caution:</span> Changing project dates will affect all task validation bounds across the network graph.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                            <Users className="h-4 w-4 text-indigo-500" />
                                            Team Management
                                        </Label>
                                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 rounded-lg">
                                            {selectedMembers.length} Active
                                        </Badge>
                                    </div>

                                    {/* Selected Members Badges */}
                                    {selectedMembers.length > 0 && (
                                        <div className="flex flex-wrap gap-2 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                                            {getSelectedUserObjects().map(user => (
                                                <Badge 
                                                    key={user._id} 
                                                    variant="secondary" 
                                                    className="pl-1 pr-2 py-1 gap-2 bg-white border-slate-200 shadow-sm hover:bg-slate-50 cursor-pointer"
                                                    onClick={() => toggleMember(user._id)}
                                                >
                                                    <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                                                        {user.profilePhoto ? (
                                                            <img src={user.profilePhoto} alt={user.name} className="h-full w-full object-cover" />
                                                        ) : (
                                                            <span className="text-[8px] font-bold text-indigo-700">{user.name.charAt(0)}</span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs font-semibold">{user.name}</span>
                                                    <div className="h-4 w-4 rounded-full hover:bg-slate-200 flex items-center justify-center ml-1">
                                                        <span className="text-slate-400 text-xs leading-none">&times;</span>
                                                    </div>
                                                </Badge>
                                            ))}
                                        </div>
                                    )}

                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input 
                                            placeholder="Find members to add..." 
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10 h-10 rounded-xl border-slate-200 bg-slate-50/30"
                                        />
                                    </div>

                                    <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/30 max-h-[480px] overflow-y-auto divide-y divide-slate-100 shadow-inner">
                                        {filteredUsers.length === 0 ? (
                                            <div className="p-8 text-center text-slate-400 text-sm italic">
                                                No available users found
                                            </div>
                                        ) : (
                                            filteredUsers.map(user => (
                                                <div 
                                                    key={user._id} 
                                                    className="flex items-center gap-3 p-3 hover:bg-white transition-colors cursor-pointer group"
                                                    onClick={() => toggleMember(user._id)}
                                                >
                                                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 border-2 border-white shadow-sm overflow-hidden">
                                                        {user.profilePhoto ? (
                                                            <img src={user.profilePhoto} alt={user.name} className="h-full w-full object-cover" />
                                                        ) : (
                                                            <span className="text-[10px] font-bold">{user.name.charAt(0)}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">{user.name}</p>
                                                        <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                                                    </div>
                                                    <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        Add
                                                    </Button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-8 border-t border-slate-100 bg-slate-50/30">
                    <SheetFooter className="sm:flex-row gap-3">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="flex-1 rounded-xl h-12">
                            Discard Changes
                        </Button>
                        <Button 
                            onClick={handleSubmit} 
                            disabled={isSubmitting || !title}
                            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12 font-black shadow-xl shadow-slate-200"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {isSubmitting ? 'Updating...' : 'Save Configuration'}
                        </Button>
                    </SheetFooter>
                </div>
            </SheetContent>
        </Sheet>
    );
}
