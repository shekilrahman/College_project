import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User from '../models/user.model';

interface AuthRequest extends Request {
    user?: any;
}

const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            if (!token) {
                res.status(401).json({ message: 'Not authorized, no token' });
                return;
            }

            if (!process.env.JWT_SECRET) {
                throw new Error('JWT_SECRET not defined');
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as unknown as { id: string };

            req.user = await User.findById(decoded.id).select('-password');

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user && req.user.type === 'admin') {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};

const adminOrPm = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user && (req.user.type === 'admin' || req.user.type === 'pm')) {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin or PM' });
    }
};

export { protect, admin, adminOrPm };
