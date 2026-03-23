import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Trash2, Plus, RefreshCw } from 'lucide-react';
import { User, Task } from '@/api/types';
import { DatePicker } from '@/components/ui/date-picker';

interface SimulationConditions {
    memberLeaves?: Array<{ userId: string; startDate: string; endDate: string; }>;
    globalHolidays?: Array<{ startDate: string; endDate: string; }>;
    taskDelays?: Array<{ taskId: string; additionalDays: number; }>;
}

interface SimulationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectMembers: User[];
    projectTasks: Task[];
    onSimulate: (conditions: SimulationConditions) => Promise<void>;
    onReset: () => Promise<void>;
    isSimulating: boolean;
}

export function SimulationModal({ open, onOpenChange, projectMembers, projectTasks, onSimulate, onReset, isSimulating }: SimulationModalProps) {
    const [leaves, setLeaves] = useState<Array<{ userId: string; startDate: Date | undefined; endDate: Date | undefined; id: string }>>([]);
    const [holidays, setHolidays] = useState<Array<{ startDate: Date | undefined; endDate: Date | undefined; id: string }>>([]);
    const [delays, setDelays] = useState<Array<{ taskId: string; additionalDays: number; id: string }>>([]);

    const handleAddLeave = () => setLeaves([...leaves, { id: Math.random().toString(), userId: '', startDate: undefined, endDate: undefined }]);
    const handleRemoveLeave = (id: string) => setLeaves(leaves.filter(l => l.id !== id));
    const handleLeaveChange = (id: string, field: 'userId' | 'startDate' | 'endDate', value: any) => setLeaves(leaves.map(l => l.id === id ? { ...l, [field]: value } : l));

    const handleAddHoliday = () => setHolidays([...holidays, { id: Math.random().toString(), startDate: undefined, endDate: undefined }]);
    const handleRemoveHoliday = (id: string) => setHolidays(holidays.filter(h => h.id !== id));
    const handleHolidayChange = (id: string, field: 'startDate' | 'endDate', value: any) => setHolidays(holidays.map(h => h.id === id ? { ...h, [field]: value } : h));

    const handleAddDelay = () => setDelays([...delays, { id: Math.random().toString(), taskId: '', additionalDays: 1 }]);
    const handleRemoveDelay = (id: string) => setDelays(delays.filter(d => d.id !== id));
    const handleDelayChange = (id: string, field: 'taskId' | 'additionalDays', value: any) => setDelays(delays.map(d => d.id === id ? { ...d, [field]: value } : d));

    const handleRunSimulation = async () => {
        const validLeaves = leaves.filter(l => l.userId && l.startDate && l.endDate).map(l => ({
            userId: l.userId,
            startDate: new Date(l.startDate!).toISOString(),
            endDate: new Date(l.endDate!).toISOString()
        }));
        
        const validHolidays = holidays.filter(h => h.startDate && h.endDate).map(h => ({
            startDate: new Date(h.startDate!).toISOString(),
            endDate: new Date(h.endDate!).toISOString()
        }));

        const validDelays = delays.filter(d => d.taskId && d.additionalDays !== undefined && !isNaN(d.additionalDays)).map(d => ({
            taskId: d.taskId,
            additionalDays: Number(d.additionalDays)
        }));

        await onSimulate({ 
            memberLeaves: validLeaves,
            globalHolidays: validHolidays,
            taskDelays: validDelays
        });
        onOpenChange(false);
    };

    const handleReset = async () => {
        await onReset();
        setLeaves([]);
        setHolidays([]);
        setDelays([]);
        onOpenChange(false);
    };

    const isValid = leaves.every(l => l.userId && l.startDate && l.endDate) && 
                    holidays.every(h => h.startDate && h.endDate) &&
                    delays.every(d => d.taskId && !isNaN(d.additionalDays)) &&
                    (leaves.length > 0 || holidays.length > 0 || delays.length > 0);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-indigo-500" />
                        Timeline Simulation
                    </DialogTitle>
                    <DialogDescription>
                        Predict how team member leaves will impact the project schedule.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="leaves" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="leaves">Member Leaves</TabsTrigger>
                        <TabsTrigger value="holidays">Global Holidays</TabsTrigger>
                        <TabsTrigger value="delays">Task Delays</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="leaves" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-semibold">Team Member Leaves</Label>
                            <Button type="button" variant="outline" size="sm" onClick={handleAddLeave} className="h-8">
                                <Plus className="h-4 w-4 mr-1" /> Add Leave
                            </Button>
                        </div>
                        {leaves.length === 0 ? (
                            <div className="text-center py-6 text-sm text-slate-500 bg-slate-50 rounded-lg border border-dashed">
                                No leaves added. Simulate a specific member's absence.
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                                {leaves.map((leave) => (
                                    <div key={leave.id} className="p-3 bg-slate-50 rounded-lg border flex gap-3 relative">
                                        <div className="flex-1 space-y-3">
                                            <div className="space-y-1">
                                                <Label className="text-xs">Team Member</Label>
                                                <Select value={leave.userId} onValueChange={(val) => handleLeaveChange(leave.id, 'userId', val)}>
                                                    <SelectTrigger className="h-8"><SelectValue placeholder="Select member" /></SelectTrigger>
                                                    <SelectContent>
                                                        {projectMembers.map(m => <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="flex-1 space-y-1">
                                                    <Label className="text-xs">Start Date</Label>
                                                    <DatePicker date={leave.startDate} setDate={(date) => handleLeaveChange(leave.id, 'startDate', date)} placeholder="Start Date" />
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <Label className="text-xs">End Date</Label>
                                                    <DatePicker date={leave.endDate} setDate={(date) => handleLeaveChange(leave.id, 'endDate', date)} placeholder="End Date" minDate={leave.startDate} />
                                                </div>
                                            </div>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 self-start mt-5" onClick={() => handleRemoveLeave(leave.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="holidays" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-semibold">Project-wide Holidays</Label>
                            <Button type="button" variant="outline" size="sm" onClick={handleAddHoliday} className="h-8">
                                <Plus className="h-4 w-4 mr-1" /> Add Holiday
                            </Button>
                        </div>
                        {holidays.length === 0 ? (
                            <div className="text-center py-6 text-sm text-slate-500 bg-slate-50 rounded-lg border border-dashed">
                                No holidays added. Simulate a full project pause.
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                                {holidays.map((holiday) => (
                                    <div key={holiday.id} className="p-3 bg-slate-50 rounded-lg border flex gap-3 relative">
                                        <div className="flex-1 flex gap-2">
                                            <div className="flex-1 space-y-1">
                                                <Label className="text-xs">Start Date</Label>
                                                <DatePicker date={holiday.startDate} setDate={(date) => handleHolidayChange(holiday.id, 'startDate', date)} placeholder="Start Date" />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <Label className="text-xs">End Date</Label>
                                                <DatePicker date={holiday.endDate} setDate={(date) => handleHolidayChange(holiday.id, 'endDate', date)} placeholder="End Date" minDate={holiday.startDate} />
                                            </div>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 self-start mt-5" onClick={() => handleRemoveHoliday(holiday.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="delays" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-semibold">Task Duration Delays</Label>
                            <Button type="button" variant="outline" size="sm" onClick={handleAddDelay} className="h-8">
                                <Plus className="h-4 w-4 mr-1" /> Add Delay
                            </Button>
                        </div>
                        {delays.length === 0 ? (
                            <div className="text-center py-6 text-sm text-slate-500 bg-slate-50 rounded-lg border border-dashed">
                                No scope changes added. Simulate a specific task exploding in scope.
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                                {delays.map((delay) => (
                                    <div key={delay.id} className="p-3 bg-slate-50 rounded-lg border flex gap-3 relative">
                                        <div className="flex-1 space-y-3">
                                            <div className="space-y-1">
                                                <Label className="text-xs">Specific Task</Label>
                                                <Select value={delay.taskId} onValueChange={(val) => handleDelayChange(delay.id, 'taskId', val)}>
                                                    <SelectTrigger className="h-8"><SelectValue placeholder="Select task" /></SelectTrigger>
                                                    <SelectContent>
                                                        {projectTasks.map(t => <SelectItem key={t._id} value={t._id}>{t.title}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Additional Days Needed</Label>
                                                <input 
                                                    type="number" 
                                                    min="1"
                                                    value={delay.additionalDays}
                                                    onChange={e => handleDelayChange(delay.id, 'additionalDays', e.target.value)}
                                                    className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                                />
                                            </div>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 self-start mt-5" onClick={() => handleRemoveDelay(delay.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                <DialogFooter className="sm:justify-between">
                    <Button variant="outline" onClick={handleReset} disabled={isSimulating}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Reset
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button 
                            onClick={handleRunSimulation} 
                            disabled={isSimulating || (!isValid)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {isSimulating ? 'Simulating...' : 'Run Simulation'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
