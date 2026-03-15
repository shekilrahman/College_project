import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { getUsers } from '@/api/users'
import { User } from '@/api/types'
import { useAuth } from '@/context/AuthContext'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Users, Shield, Code2, Briefcase } from "lucide-react"
import { CreateUserDialog } from '@/components/CreateUserDialog'
import { Card, CardContent } from '@/components/ui/card'

export const Route = createFileRoute('/dashboard/users')({
    component: AdminUsersComponent,
})

function AdminUsersComponent() {
    const { user } = useAuth();
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        }
    };

    if (user?.type !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh] space-y-4">
                <Shield className="h-16 w-16 text-muted-foreground/30" />
                <div className="space-y-2">
                    <h2 className="text-2xl font-semibold tracking-tight">Access Restricted</h2>
                    <p className="text-muted-foreground">This area is reserved for administrators only.</p>
                </div>
            </div>
        );
    }

    // Calculate stats
    const totalUsers = users.length;
    const admins = users.filter(u => u.type === 'admin').length;
    const devs = users.filter(u => u.type === 'dev').length;
    const pms = users.filter(u => u.type === 'pm').length;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
                    <p className="text-muted-foreground">Manage access and roles for your organization.</p>
                </div>
                <CreateUserDialog onUserCreated={fetchUsers} />
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-primary/5 border-primary/10">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-full bg-primary/10 text-primary">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                            <h3 className="text-2xl font-bold">{totalUsers}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-full bg-blue-500/10 text-blue-500">
                            <Shield className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Admins</p>
                            <h3 className="text-2xl font-bold">{admins}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-full bg-orange-500/10 text-orange-500">
                            <Briefcase className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Managers</p>
                            <h3 className="text-2xl font-bold">{pms}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-500">
                            <Code2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Developers</p>
                            <h3 className="text-2xl font-bold">{devs}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* User List Section */}
            <div className="rounded-xl border border-border/50 bg-card text-card-foreground shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[80px]">Avatar</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((u) => (
                            <TableRow key={u._id} className="hover:bg-muted/30 transition-colors">
                                <TableCell>
                                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary ring-2 ring-background">
                                        {u.name.charAt(0)}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{u.name}</span>
                                        <span className="text-xs text-muted-foreground">{u.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={`uppercase text-[10px] tracking-wider font-semibold 
                                            ${u.type === 'admin' ? 'border-blue-500/30 text-blue-500 bg-blue-500/5' :
                                            u.type === 'pm' ? 'border-orange-500/30 text-orange-500 bg-orange-500/5' :
                                                'border-indigo-500/30 text-indigo-500 bg-indigo-500/5'}`}>
                                        {u.type === 'pm' ? 'Manager' : u.type}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                        <span className="text-xs text-muted-foreground font-medium">Active</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-50 hover:opacity-100">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {users.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                    No users found. Add your first team member!
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
