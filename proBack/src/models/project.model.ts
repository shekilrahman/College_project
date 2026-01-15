import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
    title: string;
    description: string;
}

const projectSchema = new Schema({}, { timestamps: true });

const Project = mongoose.model<IProject>('Project', projectSchema);

export default Project;
