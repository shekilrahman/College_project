import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    type: string;
    profilePhoto?: string;
    performanceFactor: number;
    metrics: {
        totalTasksCompleted: number;
        averageCompletionTime: number; // in hours
        onTimeCompletionRate: number; // percentage
        totalProjectsInvolved: number;
        efficiencyScore: number; // 0-100
        lastCalculationDate: Date;
    };
    matchPassword(enteredPassword: string): Promise<boolean>;
}

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['admin', 'pm', 'dev', 'intern', 'user'],
        required: true,
        default: 'dev',
    },
    profilePhoto: {
        type: String,
    },
    performanceFactor: {
        type: Number,
        default: 1.0,
    },
    metrics: {
        totalTasksCompleted: { type: Number, default: 0 },
        averageCompletionTime: { type: Number, default: 0 },
        onTimeCompletionRate: { type: Number, default: 0 },
        totalProjectsInvolved: { type: Number, default: 0 },
        efficiencyScore: { type: Number, default: 0 },
        lastCalculationDate: { type: Date, default: Date.now },
    },
}, {
    timestamps: true,
});

userSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model<IUser>('User', userSchema);

export default User;
