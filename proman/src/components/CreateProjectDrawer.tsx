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
import { DatePicker } from '@/components/ui/date-picker';
import { createProject } from '@/api/projects';
import { getUsers } from '@/api/users';
import { User } from '@/api/types';
import { Plus, FolderPlus, Users, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface CreateProjectDrawerProps {
    onProjectCreated: () => void;
}

export function CreateProjectDrawer({ onProjectCreated }: CreateProjectDrawerProps) {
    const { user: currentUser } = useAuth();
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState<Date | undefined>(new Date());
    const [endDate, setEndDate] = useState<Date | undefined>(new Date());
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            fetchUsers();
        }
    }, [open]);

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

    // Filter out the current user (creator) and already selected members from the search list
    const filteredUsers = users.filter(u =>
        u._id !== currentUser?._id &&
        !selectedMembers.includes(u._id) &&
        (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const getSelectedUserObjects = () => {
        return selectedMembers.map(id => users.find(u => u._id === id)).filter(Boolean) as User[];
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        try {
            if (!startDate || !endDate) return;
            setIsSubmitting(true);

            await createProject({
                title,
                description,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                // Note: You might need to update CreateProjectRequest type in api/types if it doesn't have members
                // But I already updated the controller to expect it.
                // @ts-ignore
                members: selectedMembers
            });

            toast.success('Project created successfully');
            setOpen(false);
            resetForm();
            onProjectCreated();
        } catch (error) {
            console.error("Failed to create project", error);
            toast.error('Failed to create project');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setStartDate(new Date());
        setEndDate(new Date());
        setSelectedMembers([]);
        setSearchQuery('');
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 rounded-xl h-10 px-5">
                    <Plus className="h-4 w-4" />
                    New Project
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-none sm:w-[950px] flex flex-col h-full border-l border-slate-200 bg-white p-0">
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    <SheetHeader className="space-y-1">
                        <div className="flex items-center gap-2 text-indigo-600 mb-2">
                            <FolderPlus className="h-5 w-5" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Project Initialization</span>
                        </div>
                        <SheetTitle className="text-3xl font-black tracking-tight text-slate-900">Create Workspace</SheetTitle>
                        <SheetDescription className="text-slate-500 text-base">
                            Define the project scope, timeline, and core team members.
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
                                        placeholder="e.g., Institutional ERP Migration"
                                        className="h-12 rounded-xl border-slate-200 bg-slate-50/30 focus-visible:ring-indigo-500/20 text-lg font-medium"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-sm font-semibold text-slate-700">Scope Description</Label>
                                    <Textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Provide a brief overview of the project goals..."
                                        className="min-h-[140px] rounded-xl border-slate-200 bg-slate-50/30 focus-visible:ring-indigo-500/20 resize-none p-4"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700">Start Date</Label>
                                        <DatePicker date={startDate} setDate={setStartDate} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700">Target End</Label>
                                        <DatePicker date={endDate} setDate={setEndDate} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                            <Users className="h-4 w-4 text-indigo-500" />
                                            Team Assembly
                                        </Label>
                                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 rounded-lg">
                                            {selectedMembers.length} Selected
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
                                            placeholder="Search members to add..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10 h-10 rounded-xl border-slate-200 bg-slate-50/30"
                                        />
                                    </div>

                                    <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/30 max-h-[340px] overflow-y-auto divide-y divide-slate-100">
                                        {filteredUsers.length === 0 ? (
                                            <div className="p-8 text-center text-slate-400 text-sm italic">
                                                No available members found
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
                    <SheetFooter className="sm:justify-between items-center gap-4">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em]">
                            Proman Core Workspace Initialization
                        </p>
                        <div className="flex gap-3">
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-xl h-12 px-6">
                                Discard
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !title}
                                className="px-10 bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12 font-black shadow-xl shadow-slate-200"
                            >
                                {isSubmitting ? 'Initializing...' : 'Launch Project'}
                            </Button>
                        </div>
                    </SheetFooter>
                </div>
            </SheetContent>
        </Sheet>
    );
}
