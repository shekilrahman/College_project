import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: any;
}
declare const createTask: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const getTasks: (req: AuthRequest, res: Response) => Promise<void>;
declare const getTaskById: (req: AuthRequest, res: Response) => Promise<void>;
declare const updateTask: (req: AuthRequest, res: Response) => Promise<void>;
declare const deleteTask: (req: AuthRequest, res: Response) => Promise<void>;
declare const startTask: (req: AuthRequest, res: Response) => Promise<void>;
declare const updateProgress: (req: AuthRequest, res: Response) => Promise<void>;
declare const completeTask: (req: AuthRequest, res: Response) => Promise<void>;
declare const createBulkTasks: (req: AuthRequest, res: Response) => Promise<void>;
export { createTask, createBulkTasks, getTasks, getTaskById, updateTask, deleteTask, startTask, updateProgress, completeTask };
//# sourceMappingURL=task.controller.d.ts.map