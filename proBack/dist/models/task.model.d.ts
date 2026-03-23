import mongoose, { Document } from 'mongoose';
export interface ITaskDates {
    assignedDate?: Date;
    toStartDate?: Date;
    toCompleteDate?: Date;
    startedDate?: Date;
    completedDate?: Date;
}
export interface ITask extends Document {
    title: string;
    description: string;
    status: 'Pending' | 'In Progress' | 'Completed';
    priority: 'Low' | 'Medium' | 'High';
    dates: ITaskDates;
    project: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    assignedTo?: mongoose.Types.ObjectId;
    parentTask?: mongoose.Types.ObjectId;
    dependencies: mongoose.Types.ObjectId[];
    level: number;
    progress: number;
    weight: number;
    progressHistory: Array<{
        progress: number;
        timestamp: Date;
        note?: string;
    }>;
    createdAt: Date;
    updatedAt: Date;
}
declare const Task: mongoose.Model<ITask, {}, {}, {}, mongoose.Document<unknown, {}, ITask, {}, mongoose.DefaultSchemaOptions> & ITask & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ITask>;
export default Task;
//# sourceMappingURL=task.model.d.ts.map