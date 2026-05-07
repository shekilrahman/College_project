import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Trash2 } from "lucide-react";
import { deleteProject } from "@/api/projects";
import { Project } from "@/api/types";

interface DeleteProjectDialogProps {
    project: Project;
    onDeleted: () => void;
    children?: React.ReactNode;
}

export function DeleteProjectDialog({ project, onDeleted, children }: DeleteProjectDialogProps) {
    const [confirmName, setConfirmName] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const isConfirmed = confirmName === project.title;

    const handleDelete = async () => {
        if (!isConfirmed || isDeleting) return;

        setIsDeleting(true);
        try {
            await deleteProject(project._id);
            setIsOpen(false);
            onDeleted();
        } catch (error) {
            console.error("Failed to delete project", error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(val) => {
            setIsOpen(val);
            if (!val) setConfirmName('');
        }}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Project
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                    <div className="flex items-center gap-3 text-red-600 mb-2">
                        <div className="p-2 rounded-full bg-red-50">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <DialogTitle className="text-xl">Delete Project?</DialogTitle>
                    </div>
                    <DialogDescription className="text-slate-500 pt-2 text-sm leading-relaxed">
                        This action is <span className="font-bold text-slate-900">permanent</span>. All tasks, dependencies, and history related to <span className="font-bold text-slate-900">"{project.title}"</span> will be removed from the repository.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="confirm-name" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            To confirm, type <span className="text-slate-900 select-all italic">"{project.title}"</span> below
                        </Label>
                        <Input
                            id="confirm-name"
                            value={confirmName}
                            onChange={(e) => setConfirmName(e.target.value)}
                            placeholder="Type project name here..."
                            className="h-11 bg-slate-50/50 border-slate-200 focus-visible:ring-red-500/20"
                            autoComplete="off"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={() => setIsOpen(false)}
                        className="text-slate-500"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={!isConfirmed || isDeleting}
                        className="bg-red-600 hover:bg-red-700 shadow-md shadow-red-500/20 px-6"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete Project'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
