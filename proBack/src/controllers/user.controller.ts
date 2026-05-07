import { Request, Response } from 'express';
import User from '../models/user.model';
import Project from '../models/project.model';

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

// @desc    Get user details with projects
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // Fetch projects managed by this user
        const projects = await Project.find({ createdBy: user._id });

        res.json({
            user,
            projects
        });
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

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin)
const updateUser = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.type = req.body.type || user.type;

            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                type: updatedUser.type,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
const deleteUser = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            // Check if user is the last admin
            if (user.type === 'admin') {
                const adminCount = await User.countDocuments({ type: 'admin' });
                if (adminCount <= 1) {
                    res.status(400).json({ message: 'Cannot delete the last administrator' });
                    return;
                }
            }

            await User.deleteOne({ _id: user._id });
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export { getUsers, getUserById, createUser, updateUser, deleteUser };
