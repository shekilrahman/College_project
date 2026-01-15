import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
}

const userSchema = new Schema({}, { timestamps: true });

const User = mongoose.model<IUser>('User', userSchema);

export default User;
