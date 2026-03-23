import { Request, Response, NextFunction } from 'express';
interface AuthRequest extends Request {
    user?: any;
}
declare const protect: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
declare const admin: (req: AuthRequest, res: Response, next: NextFunction) => void;
declare const adminOrPm: (req: AuthRequest, res: Response, next: NextFunction) => void;
export { protect, admin, adminOrPm };
//# sourceMappingURL=auth.middleware.d.ts.map