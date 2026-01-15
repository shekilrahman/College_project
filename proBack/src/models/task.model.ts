import mongoose, { Document, Schema } from 'mongoose';

export interface ITask extends Document {
    title: string;
    description: string;
}

const taskSchema = new Schema({}, { timestamps: true });

const Task = mongoose.model<ITask>('Task', taskSchema);

export default Task;
