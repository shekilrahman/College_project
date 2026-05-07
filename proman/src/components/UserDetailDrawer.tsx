import { useState, useEffect } from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet"
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    getUserById, 
    UserDetailResponse, 
    deleteUser, 
    updateUser 
} from '@/api/users';
import { 
    User as UserIcon, 
    Mail, 
    Shield, 
    FolderKanban, 
    Activity, 
    CheckCircle2, 
    Trash2,
    Edit3,
    Calendar,
    ArrowRight,
    Zap,
    Target,
    Timer,
    TrendingUp
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { formatDate } from '@/lib/formatters'

interface UserDetailDrawerProps {
    userId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUserUpdated: () => void;
}

export function UserDetailDrawer({ userId, open, onOpenChange, onUserUpdated }: UserDetailDrawerProps) {
    const [data, setData] = useState<UserDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    
    // Edit Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open && userId) {
            fetchUserDetails();
        } else {
            setData(null);
            setIsEditing(false);
        }
    }, [open, userId]);

    const fetchUserDetails = async () => {
        setLoading(true);
        try {
            if (!userId) return;
            const res = await getUserById(userId);
            setData(res);
            setName(res.user.name);
            setEmail(res.user.email);
            setRole(res.user.type);
        } catch (error) {
            toast.error('Failed to load user details.');
            onOpenChange(false);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!userId) return;
        setSaving(true);
        try {
            await updateUser(userId, { name, email, type: role as any });
            toast.success('User updated successfully.');
            setIsEditing(false);
            fetchUserDetails();
            onUserUpdated();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Update failed.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!userId || !confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
        try {
            await deleteUser(userId);
            toast.success('User deleted successfully.');
            onOpenChange(false);
            onUserUpdated();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Delete failed.');
        }
    };

    const roleConfig = {
        admin: { label: 'Administrator', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
        pm: { label: 'Project Manager', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
        dev: { label: 'Developer', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
        intern: { label: 'Intern', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
        user: { label: 'User', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
    };

    const currentRole = data ? (roleConfig[data.user.type as keyof typeof roleConfig] || roleConfig.user) : roleConfig.user;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[500px] p-0 flex flex-col h-full bg-white border-l border-slate-100 shadow-2xl">
                {loading ? (
                    <div className="p-8 space-y-8 animate-pulse">
                        <Skeleton className="h-12 w-12 rounded-2xl" />
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-20 rounded-2xl" />
                            <Skeleton className="h-20 rounded-2xl" />
                        </div>
                        <Skeleton className="h-64 rounded-3xl" />
                    </div>
                ) : data && (
                    <>
                        <div className="p-8 space-y-10 flex-1 overflow-y-auto">
                            <SheetHeader className="relative">
                                <div className="h-16 w-16 rounded-[1.25rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-4 shadow-inner overflow-hidden">
                                    {data.user.profilePhoto ? (
                                        <img src={data.user.profilePhoto} alt={data.user.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <UserIcon className="h-8 w-8" />
                                    )}
                                </div>
                                
                                {!isEditing ? (
                                    <>
                                        <div className="space-y-2">
                                            <SheetTitle className="text-3xl font-black text-slate-900 tracking-tighter">{data.user.name}</SheetTitle>
                                            <div className="flex items-center gap-3">
                                                <Badge className={`${currentRole.bg} ${currentRole.color} ${currentRole.border} border h-6 px-3 text-[10px] font-black uppercase tracking-widest`}>
                                                    {currentRole.label}
                                                </Badge>
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Status</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-4">
                                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Work Email</p>
                                                <p className="text-sm font-bold text-slate-800 break-all">{data.user.email}</p>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Member Since</p>
                                                <p className="text-sm font-bold text-slate-800">{formatDate(data.user.createdAt)}</p>
                                            </div>
                                        </div>

                                        {/* Performance Section */}
                                        <div className="space-y-6 pt-4">
                                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                                <TrendingUp className="h-3.5 w-3.5 text-indigo-600" /> Performance Analysis
                                            </h3>
                                            
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex flex-col items-center text-center">
                                                    <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Factor</p>
                                                    <p className="text-xl font-black text-indigo-600 tracking-tighter">{data.user.performanceFactor?.toFixed(2) || '1.00'}x</p>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex flex-col items-center text-center">
                                                    <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">On-Time</p>
                                                    <p className="text-xl font-black text-emerald-600 tracking-tighter">{data.user.metrics?.onTimeCompletionRate || 0}%</p>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 flex flex-col items-center text-center">
                                                    <p className="text-[8px] font-black text-purple-400 uppercase tracking-widest mb-1">Efficiency</p>
                                                    <p className="text-xl font-black text-purple-600 tracking-tighter">{data.user.metrics?.efficiencyScore || 0}%</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    <Timer className="h-4 w-4 text-slate-400" />
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Avg Completion Time</span>
                                                </div>
                                                <span className="text-sm font-black text-slate-800">{data.user.metrics?.averageCompletionTime || 0} Hours</span>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                                    <FolderKanban className="h-3.5 w-3.5" /> Working Projects
                                                </h3>
                                                <Badge variant="outline" className="h-5 text-[10px] font-black">{data.projects.length}</Badge>
                                            </div>

                                            <div className="space-y-3">
                                                {data.projects.length === 0 ? (
                                                    <div className="p-10 rounded-[2.5rem] bg-slate-50/50 border border-dashed border-slate-200 flex flex-col items-center text-center">
                                                        <Activity className="h-8 w-8 text-slate-300 mb-3" />
                                                        <p className="text-xs font-bold text-slate-400">No active projects assigned</p>
                                                    </div>
                                                ) : (
                                                    data.projects.map((p) => (
                                                        <div key={p._id} className="group p-5 rounded-[1.75rem] bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <p className="font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{p.title}</p>
                                                                <Badge variant="outline" className="h-5 text-[9px] font-black uppercase tracking-tight">{p.status}</Badge>
                                                            </div>
                                                            <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(p.startDate)}</span>
                                                                <ArrowRight className="h-2.5 w-2.5" />
                                                                <span>{formatDate(p.endDate)}</span>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-8 pt-4">
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Full Name</Label>
                                            <Input 
                                                value={name} 
                                                onChange={(e) => setName(e.target.value)}
                                                className="h-12 bg-slate-50 border-slate-200 rounded-xl font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Work Email</Label>
                                            <Input 
                                                value={email} 
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="h-12 bg-slate-50 border-slate-200 rounded-xl font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">System Role</Label>
                                            <Select value={role} onValueChange={setRole}>
                                                <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl font-bold">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                    <SelectItem value="pm">Project Manager</SelectItem>
                                                    <SelectItem value="dev">Developer</SelectItem>
                                                    <SelectItem value="intern">Intern</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}
                            </SheetHeader>
                        </div>

                        <SheetFooter className="p-8 bg-slate-50/50 border-t border-slate-100 flex-col sm:flex-col gap-3">
                            {!isEditing ? (
                                <>
                                    <Button 
                                        onClick={() => setIsEditing(true)}
                                        className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-500/30 text-lg font-black tracking-tight"
                                    >
                                        <Edit3 className="h-5 w-5 mr-3" />
                                        EDIT MEMBER
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        onClick={handleDelete}
                                        className="w-full h-12 rounded-xl font-bold text-red-500 hover:text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        TERMINATE ACCOUNT
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button 
                                        onClick={handleUpdate}
                                        disabled={saving}
                                        className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-500/30 text-lg font-black tracking-tight"
                                    >
                                        {saving ? 'SYNCING...' : 'COMMIT CHANGES'}
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        onClick={() => setIsEditing(false)}
                                        className="w-full h-12 rounded-xl font-bold text-slate-400 hover:text-slate-600"
                                    >
                                        CANCEL
                                    </Button>
                                </>
                            )}
                        </SheetFooter>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
