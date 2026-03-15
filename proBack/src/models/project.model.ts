import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    status: 'Planned' | 'Active' | 'Completed' | 'On Hold';
    createdBy: mongoose.Types.ObjectId;
}

const projectSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ['Planned', 'Active', 'Completed', 'On Hold'],
        default: 'Planned',
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});

const Project = mongoose.model<IProject>('Project', projectSchema);

export default Project;
