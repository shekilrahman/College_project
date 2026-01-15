import { Request, Response, NextFunction } from 'express';

interface AuthRequest extends Request {
    user?: any;
}

const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    next();
};

const admin = (req: AuthRequest, res: Response, next: NextFunction) => {
    next();
};

const adminOrPm = (req: AuthRequest, res: Response, next: NextFunction) => {
    next();
};

export { protect, admin, adminOrPm };
