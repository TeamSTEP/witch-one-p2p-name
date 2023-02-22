import { User, NetworkInst } from './index';

export {};

declare module 'express-session' {
    interface SessionData {
        user?: User;
    }
}

declare global {
    namespace Express {
        export interface Request {
            networkInst: NetworkInst;
        }
    }
}
