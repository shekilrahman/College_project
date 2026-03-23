import mongoose, { Document } from 'mongoose';
export interface IProject extends Document {
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    status: 'Planned' | 'Active' | 'Completed' | 'On Hold';
    createdBy: mongoose.Types.ObjectId;
}
declare const Project: mongoose.Model<IProject, {}, {}, {}, mongoose.Document<unknown, {}, IProject, {}, mongoose.DefaultSchemaOptions> & IProject & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IProject>;
export default Project;
//# sourceMappingURL=project.model.d.ts.map