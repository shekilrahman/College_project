import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'
import {
    User as UserIcon,
    Mail,
    Shield,
    Info,
    FolderKanban,
    Camera,
    Lock,
    Eye,
    EyeOff,
    Save,
    Settings,
    KeyRound,
    UserCog,
    AtSign,
    Briefcase,
    Calendar,
    ArrowRight,
    Upload,
    Zap,
    Target,
    Timer,
    TrendingUp,
    CheckCircle2,
} from 'lucide-react'
import api from '@/api/index'
import { toast } from 'sonner'
import { ImageCropper } from '@/components/ImageCropper'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from '@/lib/formatters'

export const Route = createFileRoute('/dashboard/profile')({
    component: ProfileComponent,
})

function ProfileComponent() {
    const { user, login } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    
    // Drawers state
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

    // Refresh user data from backend on mount to get latest metrics
    useEffect(() => {
        const fetchFreshUser = async () => {
            try {
                if (user?._id) {
                    const res = await api.get(`/users/${user._id}`);
                    // res.data.user should have the latest metrics
                    if (res.data && res.data.user) {
                        login(localStorage.getItem('token') || '', res.data.user);
                    }
                }
            } catch (err) {
                console.error("Failed to refresh user data", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFreshUser();
    }, []);

    if (isLoading || !user) {
        return <ProfileSkeleton />;
    }

    const userInitial = user?.name?.charAt(0)?.toUpperCase() || '?';

    const roleConfig = {
        admin: { label: 'Administrator', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
        pm: { label: 'Project Manager', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
        dev: { label: 'Developer', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
        intern: { label: 'Intern', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
        user: { label: 'User', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
    };

    const currentRole = roleConfig[user?.type as keyof typeof roleConfig] || roleConfig.user;

    return (
        <div className="w-full animate-in fade-in duration-700">
            {/* Profile Hero Section */}
            <div className="relative h-72 w-full rounded-[2.5rem] bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600 shadow-2xl">
                <div className="absolute inset-0 bg-black/5 backdrop-blur-[1px] rounded-[2.5rem]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-40 rounded-[2.5rem]" />
                
                <div className="absolute -bottom-20 left-12 flex items-end gap-10">
                    <div className="relative z-20">
                        {user?.profilePhoto ? (
                            <img
                                src={user.profilePhoto}
                                alt="Profile"
                                className="h-48 w-48 rounded-[3.5rem] object-cover shadow-[0_30px_70px_rgba(0,0,0,0.45)] ring-[12px] ring-white/10 backdrop-blur-3xl"
                            />
                        ) : (
                            <div className="h-48 w-48 rounded-[3.5rem] bg-white flex items-center justify-center text-6xl font-black text-indigo-600 shadow-[0_30px_70px_rgba(0,0,0,0.45)] ring-[12px] ring-white">
                                {userInitial}
                            </div>
                        )}
                    </div>
                    <div className="pb-24 space-y-3 z-10">
                        <h1 className="text-5xl font-black text-white tracking-tighter drop-shadow-2xl">{user?.name}</h1>
                        <div className="flex items-center gap-4">
                            <Badge className="bg-white/20 backdrop-blur-xl text-white border-white/40 hover:bg-white/30 px-5 py-1.5 text-xs font-bold tracking-widest uppercase text-[10px]">
                                {currentRole.label}
                            </Badge>
                            <div className="h-2 w-2 rounded-full bg-white/40" />
                            <span className="text-base font-bold text-white/90 tracking-tight">{user?.email}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Container */}
            <div className="px-6 pt-28 space-y-10">
                {/* Action Buttons */}
                <div className="flex items-center gap-5">
                    <Sheet open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
                        <SheetTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 h-14 rounded-[1.25rem] shadow-2xl shadow-indigo-500/30 transition-all hover:scale-[1.03] active:scale-95 font-black text-base uppercase tracking-tight">
                                <UserCog className="h-5 w-5 mr-3" />
                                Edit Account
                            </Button>
                        </SheetTrigger>
                        <EditProfileDrawer 
                            user={user} 
                            login={login} 
                            onClose={() => setIsEditProfileOpen(false)} 
                        />
                    </Sheet>

                    <Sheet open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" className="border-slate-200/60 bg-white hover:bg-slate-50 px-10 h-14 rounded-[1.25rem] text-slate-700 shadow-xl shadow-slate-200/20 transition-all hover:scale-[1.03] active:scale-95 font-black text-base uppercase tracking-tight">
                                <KeyRound className="h-5 w-5 mr-3" />
                                Security
                            </Button>
                        </SheetTrigger>
                        <ChangePasswordDrawer 
                            onClose={() => setIsChangePasswordOpen(false)} 
                        />
                    </Sheet>
                </div>

                {/* Details Grid */}
                <div className="grid gap-10 lg:grid-cols-3">
                    {/* Predictive Intelligence Card */}
                    <Card className="lg:col-span-3 border-slate-200/50 shadow-2xl shadow-slate-200/30 rounded-[3rem] bg-white overflow-hidden">
                        <CardHeader className="p-12 bg-gradient-to-br from-indigo-50/50 to-white border-b border-slate-100 flex flex-row items-center justify-between">
                            <div className="space-y-1.5">
                                <CardTitle className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                                    <TrendingUp className="h-8 w-8 text-indigo-600" />
                                    Predictive Intelligence
                                </CardTitle>
                                <CardDescription className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Real-time Performance Analysis Engine</CardDescription>
                            </div>
                            <div className="flex flex-col items-end">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Performance Factor</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-4xl font-black text-indigo-600 tracking-tighter">{user.performanceFactor || '1.00'}</span>
                                    <Badge className="bg-indigo-600 text-white border-0 font-black px-2">X</Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-12">
                            <div className="grid gap-10 md:grid-cols-4">
                                <div className="space-y-4">
                                    <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                        <Target className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Efficiency Score</p>
                                        <p className="text-2xl font-black text-slate-800">{user.metrics?.efficiencyScore || 0}%</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                        <Timer className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Completion</p>
                                        <p className="text-2xl font-black text-slate-800">{user.metrics?.averageCompletionTime || 0}h</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                                        <Zap className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">On-Time Rate</p>
                                        <p className="text-2xl font-black text-slate-800">{user.metrics?.onTimeCompletionRate || 0}%</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                                        <CheckCircle2 className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tasks Completed</p>
                                        <p className="text-2xl font-black text-slate-800">{user.metrics?.totalTasksCompleted || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Personal Info Card */}
                    <Card className="lg:col-span-2 border-slate-200/50 shadow-2xl shadow-slate-200/30 rounded-[3rem] bg-white/80 backdrop-blur-sm overflow-hidden">
                        <CardHeader className="p-10 bg-slate-50/40 border-b border-slate-100 flex flex-row items-center justify-between">
                            <div className="space-y-1.5">
                                <CardTitle className="text-2xl font-black text-slate-900 tracking-tighter">Identity Details</CardTitle>
                                <CardDescription className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Verified Core Systems Data</CardDescription>
                            </div>
                            <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                                <UserIcon className="h-7 w-7" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-10 grid gap-12 sm:grid-cols-2">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
                                    <UserIcon className="h-3.5 w-3.5" /> Full Name
                                </p>
                                <p className="text-xl font-black text-slate-800 tracking-tight">{user?.name}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
                                    <AtSign className="h-3.5 w-3.5" /> Secure Email
                                </p>
                                <p className="text-xl font-black text-slate-800 tracking-tight">{user?.email}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
                                    <Shield className="h-3.5 w-3.5" /> Permissions
                                </p>
                                <div className="flex items-center gap-3">
                                    <p className="text-xl font-black text-slate-800 tracking-tight">{currentRole.label}</p>
                                    <Badge className={`${currentRole.bg} ${currentRole.color} ${currentRole.border} border-2 h-6 px-3 text-[9px] font-black uppercase tracking-[0.1em]`}>
                                        ACTIVE
                                    </Badge>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5" /> Member Since
                                </p>
                                <p className="text-xl font-black text-slate-800 tracking-tight">{formatDate(user.createdAt)}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
                                    <Info className="h-3.5 w-3.5" /> Identity ID
                                </p>
                                <p className="text-xs font-mono font-black text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 shadow-inner">{user?._id}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* System Pulse Card */}
                    <Card className="border-slate-200/50 shadow-2xl shadow-slate-200/30 rounded-[3rem] bg-white/80 backdrop-blur-sm overflow-hidden">
                        <CardHeader className="p-8 border-b border-slate-100 flex flex-col items-center">
                            <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">System Health Index</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-10">
                            <div className="p-6 rounded-[2rem] bg-slate-50/50 border border-slate-100 shadow-inner space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Security Health</span>
                                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">OPTIMAL</span>
                                </div>
                                <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden p-0.5">
                                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-[98%] shadow-sm" />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-4 group cursor-default">
                                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                                        <FolderKanban className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-base font-black text-slate-800 tracking-tight">ProMan Core</p>
                                        <div className="flex items-center gap-1.5">
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Online</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 group cursor-default">
                                    <div className="h-12 w-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-sm">
                                        <Briefcase className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-base font-black text-slate-800 tracking-tight">Workspace V4</p>
                                        <div className="flex items-center gap-1.5">
                                            <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Syncing</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function ProfileSkeleton() {
    return (
        <div className="w-full space-y-10 animate-pulse">
            <Skeleton className="h-72 w-full rounded-[2.5rem]" />
            <div className="px-6 space-y-10">
                <div className="flex gap-5">
                    <Skeleton className="h-14 w-48 rounded-[1.25rem]" />
                    <Skeleton className="h-14 w-40 rounded-[1.25rem]" />
                </div>
                <Skeleton className="h-64 w-full rounded-[3rem]" />
                <div className="grid gap-10 lg:grid-cols-3">
                    <Skeleton className="lg:col-span-2 h-[400px] rounded-[3rem]" />
                    <Skeleton className="h-[400px] rounded-[3rem]" />
                </div>
            </div>
        </div>
    );
}

function EditProfileDrawer({ user, login, onClose }: { user: any, login: any, onClose: () => void }) {
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [profilePhoto, setProfilePhoto] = useState<string | null>(user?.profilePhoto || null);
    const [saving, setSaving] = useState(false);
    
    // Photo cropping state
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [isCropperOpen, setIsCropperOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageToCrop(reader.result as string);
                setIsCropperOpen(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = (croppedImage: string) => {
        setProfilePhoto(croppedImage);
        setIsCropperOpen(false);
        setImageToCrop(null);
        toast.success('Image cropped successfully.');
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/auth/profile', { name, email, profilePhoto });
            login(localStorage.getItem('token') || '', { ...user, name, email, profilePhoto } as any);
            toast.success('Profile updated successfully.');
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Update failed.');
        } finally {
            setSaving(false);
        }
    };

    const userInitial = name?.charAt(0)?.toUpperCase() || '?';

    return (
        <SheetContent className="sm:max-w-[500px] p-0 flex flex-col h-full bg-white border-l border-slate-100 shadow-2xl">
            {imageToCrop && (
                <ImageCropper
                    image={imageToCrop}
                    open={isCropperOpen}
                    onCropComplete={handleCropComplete}
                    onCancel={() => setIsCropperOpen(false)}
                />
            )}
            
            <div className="p-10 space-y-10 flex-1 overflow-y-auto">
                <SheetHeader>
                    <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4 shadow-sm">
                        <UserCog className="h-7 w-7" />
                    </div>
                    <SheetTitle className="text-3xl font-black text-slate-900 tracking-tighter">Edit Profile</SheetTitle>
                    <SheetDescription className="text-slate-500 font-medium">
                        Modify your account credentials and personal identity.
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-4">
                    <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Profile Picture</Label>
                    <div className="flex items-center gap-6 p-6 rounded-3xl bg-slate-50 border border-slate-100 shadow-inner">
                        <div className="relative">
                            {profilePhoto ? (
                                <img
                                    src={profilePhoto}
                                    alt="Preview"
                                    className="h-24 w-24 rounded-[1.5rem] object-cover shadow-lg ring-4 ring-white"
                                />
                            ) : (
                                <div className="h-24 w-24 rounded-[1.5rem] bg-white flex items-center justify-center text-3xl font-black text-indigo-600 shadow-lg ring-4 ring-white">
                                    {userInitial}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => fileInputRef.current?.click()}
                                className="h-10 bg-white border-slate-200 text-slate-700 font-bold px-4 rounded-xl shadow-sm hover:bg-slate-50"
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload New
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="space-y-2">
                        <Label htmlFor="edit-name" className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Full Name</Label>
                        <div className="relative">
                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                                id="edit-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="h-14 pl-12 bg-slate-50/50 border-slate-200 focus-visible:ring-indigo-500/20 rounded-2xl font-bold text-slate-800"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-email" className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Email Address</Label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                                id="edit-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-14 pl-12 bg-slate-50/50 border-slate-200 focus-visible:ring-indigo-500/20 rounded-2xl font-bold text-slate-800"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <SheetFooter className="p-10 bg-slate-50/50 border-t border-slate-100 flex-col sm:flex-col gap-3">
                <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-500/30 text-lg font-black tracking-tight"
                >
                    {saving ? 'UPDATING ARCHIVE...' : 'SAVE CHANGES'}
                </Button>
                <Button variant="ghost" onClick={onClose} className="w-full h-12 rounded-xl font-bold text-slate-400 hover:text-slate-600">
                    DISCARD CHANGES
                </Button>
            </SheetFooter>
        </SheetContent>
    );
}

function ChangePasswordDrawer({ onClose }: { onClose: () => void }) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match.');
            return;
        }

        setSaving(true);
        try {
            await api.put('/auth/password', { currentPassword, newPassword });
            toast.success('Password updated successfully.');
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update password.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SheetContent className="sm:max-w-[500px] p-0 flex flex-col h-full bg-white border-l border-slate-100 shadow-2xl">
            <div className="p-10 space-y-10 flex-1 overflow-y-auto">
                <SheetHeader>
                    <div className="h-14 w-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-4 shadow-sm">
                        <Lock className="h-7 w-7" />
                    </div>
                    <SheetTitle className="text-3xl font-black text-slate-900 tracking-tighter">Security Vault</SheetTitle>
                    <SheetDescription className="text-slate-500 font-medium">
                        Update your authentication credentials to maintain high-level account security.
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-8 pt-4">
                    <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Master Password</Label>
                        <div className="relative">
                            <Input
                                type={showCurrent ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="h-14 bg-slate-50/50 border-slate-200 pr-12 rounded-2xl font-bold"
                            />
                            <button onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors">
                                {showCurrent ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">New Password String</Label>
                        <div className="relative">
                            <Input
                                type={showNew ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="h-14 bg-slate-50/50 border-slate-200 pr-12 rounded-2xl font-bold"
                            />
                            <button onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors">
                                {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Confirm Alignment</Label>
                        <Input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="h-14 bg-slate-50/50 border-slate-200 rounded-2xl font-bold"
                        />
                    </div>
                </div>
            </div>

            <SheetFooter className="p-10 bg-slate-50/50 border-t border-slate-100 flex-col sm:flex-col gap-3">
                <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-500/30 text-lg font-black tracking-tight"
                >
                    {saving ? 'UPDATING VAULT...' : 'REWRITE PASSWORD'}
                </Button>
                <Button variant="ghost" onClick={onClose} className="w-full h-12 rounded-xl font-bold text-slate-400 hover:text-slate-600">
                    CANCEL OPERATION
                </Button>
            </SheetFooter>
        </SheetContent>
    );
}
