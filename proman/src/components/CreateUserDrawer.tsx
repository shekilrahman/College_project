import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createUser } from '@/api/users';
import { UserPlus, Mail, Shield, Lock, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';

interface CreateUserDrawerProps {
    onUserCreated: () => void;
}

export function CreateUserDrawer({ onUserCreated }: CreateUserDrawerProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('dev');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createUser({
                name,
                email,
                password,
                type: role as "dev" | "admin" | "pm" | "intern" | "user",
            });
            toast.success('User account created successfully.');
            setOpen(false);
            onUserCreated();

            // Reset form
            setName('');
            setEmail('');
            setPassword('');
            setRole('dev');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 font-bold">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Team Member
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[450px] p-0 flex flex-col h-full bg-white border-l border-slate-100 shadow-2xl">
                <div className="p-8 space-y-8 flex-1 overflow-y-auto">
                    <SheetHeader>
                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-2 shadow-sm">
                            <UserPlus className="h-6 w-6" />
                        </div>
                        <SheetTitle className="text-2xl font-black text-slate-900 tracking-tight">Onboard Member</SheetTitle>
                        <SheetDescription className="text-slate-500 font-medium">
                            Register a new user to your organization. They will receive access based on the assigned role.
                        </SheetDescription>
                    </SheetHeader>

                    <form id="create-user-form" onSubmit={handleSubmit} className="space-y-6 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-[11px] font-black uppercase tracking-widest text-slate-400">Official Name</Label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input 
                                    id="name" 
                                    placeholder="John Doe" 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)} 
                                    className="h-12 pl-10 bg-slate-50/50 border-slate-200 focus-visible:ring-indigo-500/20 rounded-xl font-bold text-slate-800"
                                    required 
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[11px] font-black uppercase tracking-widest text-slate-400">Work Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input 
                                    id="email" 
                                    type="email" 
                                    placeholder="john@example.com" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    className="h-12 pl-10 bg-slate-50/50 border-slate-200 focus-visible:ring-indigo-500/20 rounded-xl font-bold text-slate-800"
                                    required 
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role" className="text-[11px] font-black uppercase tracking-widest text-slate-400">System Role</Label>
                            <div className="relative">
                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                                <Select value={role} onValueChange={setRole}>
                                    <SelectTrigger className="h-12 pl-10 bg-slate-50/50 border-slate-200 focus-visible:ring-indigo-500/20 rounded-xl font-bold text-slate-800">
                                        <SelectValue placeholder="Select Role" />
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

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-[11px] font-black uppercase tracking-widest text-slate-400">Initial Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input 
                                    id="password" 
                                    type="password" 
                                    placeholder="••••••••" 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    className="h-12 pl-10 bg-slate-50/50 border-slate-200 focus-visible:ring-indigo-500/20 rounded-xl font-bold"
                                    required 
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <SheetFooter className="p-8 bg-slate-50/50 border-t border-slate-100 flex-col sm:flex-col gap-3">
                    <Button 
                        type="submit" 
                        form="create-user-form"
                        disabled={loading}
                        className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-500/30 text-lg font-black tracking-tight"
                    >
                        {loading ? 'PROCESSING...' : 'AUTHORIZE ACCOUNT'}
                    </Button>
                    <Button variant="ghost" onClick={() => setOpen(false)} className="w-full h-12 rounded-xl font-bold text-slate-400 hover:text-slate-600">
                        CANCEL
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
