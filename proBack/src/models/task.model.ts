import mongoose, { Document, Schema } from 'mongoose';

export interface ITaskDates {
    assignedDate?: Date;    // When the task was assigned to someone
    toStartDate?: Date;     // Planned start date
    toCompleteDate?: Date;  // Planned due/completion date
    startedDate?: Date;     // Actual start date
    completedDate?: Date;   // Actual completion date
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

const taskSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
    },
    description: {
        type: String,
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Completed'],
        default: 'Pending',
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium',
    },
    dates: {
        assignedDate: { type: Date },
        toStartDate: { type: Date },
        toCompleteDate: { type: Date },
        startedDate: { type: Date },
        completedDate: { type: Date },
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    parentTask: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        default: null,
    },
    level: {
        type: Number,
        default: 0,
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    weight: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    progressHistory: {
        type: [{
            progress: { type: Number },
            timestamp: { type: Date, default: Date.now },
            note: { type: String },
        }],
        default: [],
    },
    dependencies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    }],
}, {
    timestamps: true,
});

// Helper to sync status with progress
const syncStatusWithProgress = (task: any) => {
    if (task.progress >= 100) {
        task.status = 'Completed';
        if (!task.dates?.completedDate) {
            if (!task.dates) task.dates = {};
            task.dates.completedDate = new Date();
        }
    } else if (task.progress > 0 && task.status === 'Pending') {
        task.status = 'In Progress';
        if (!task.dates?.startedDate) {
            if (!task.dates) task.dates = {};
            task.dates.startedDate = new Date();
        }
    }
};

taskSchema.pre('validate', function(this: any, next: any) {
    syncStatusWithProgress(this);
    next();
});

taskSchema.pre('save', function(this: any, next: any) {
    syncStatusWithProgress(this);
    next();
});

const Task = mongoose.model<ITask>('Task', taskSchema);

export default Task;
