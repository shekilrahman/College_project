import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: any;
}
declare const createProject: (req: AuthRequest, res: Response) => Promise<void>;
declare const getProjects: (req: AuthRequest, res: Response) => Promise<void>;
declare const getProjectById: (req: AuthRequest, res: Response) => Promise<void>;
declare const updateProject: (req: AuthRequest, res: Response) => Promise<void>;
declare const deleteProject: (req: AuthRequest, res: Response) => Promise<void>;
export { createProject, getProjects, getProjectById, updateProject, deleteProject };
//# sourceMappingURL=project.controller.d.ts.map