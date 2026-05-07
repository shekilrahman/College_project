import { Request, Response } from 'express';
import User from '../models/user.model';
import generateToken from '../utils/generateToken';

interface AuthRequest extends Request {
    user?: any;
}

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            type: user.type,
            profilePhoto: user.profilePhoto,
            token: generateToken((user._id as unknown) as string),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req: Request, res: Response): Promise<void> => {
    const { name, email, password, type } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400).json({ message: 'User already exists' });
        return;
    }

    const user = await User.create({
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
            profilePhoto: user.profilePhoto,
            token: generateToken((user._id as unknown) as string),
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            if (req.body.profilePhoto) {
                user.profilePhoto = req.body.profilePhoto;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                type: updatedUser.type,
                profilePhoto: updatedUser.profilePhoto,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// @desc    Update user password
// @route   PUT /api/auth/password
// @access  Private
const updateUserPassword = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            const { currentPassword, newPassword } = req.body;

            const isMatch = await user.matchPassword(currentPassword);

            if (!isMatch) {
                res.status(401).json({ message: 'Current password is incorrect' });
                return;
            }

            user.password = newPassword;
            await user.save();

            res.json({ message: 'Password updated successfully' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

export { authUser, registerUser, updateUserProfile, updateUserPassword };
