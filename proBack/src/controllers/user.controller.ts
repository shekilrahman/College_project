import { Request, Response } from 'express';
import User from '../models/user.model';

// @desc    Get all users
// @route   GET /api/users
// @access  Private
const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a new user (Admin only)
// @route   POST /api/users
// @access  Private (Admin)
const createUser = async (req: Request, res: Response) => {
    try {
        const { name, email, password, type } = req.body;

        const userExists = await User.findOne({ email });

        if (userExists) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }

        const user: any = await User.create({
            name,
            email,
            password,
            type,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                type: user.type,
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export { getUsers, createUser };
