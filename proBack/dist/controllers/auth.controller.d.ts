import { Request, Response } from 'express';
declare const authUser: (req: Request, res: Response) => Promise<void>;
declare const registerUser: (req: Request, res: Response) => Promise<void>;
export { authUser, registerUser };
//# sourceMappingURL=auth.controller.d.ts.map