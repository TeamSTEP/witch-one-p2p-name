declare module 'express-session' {
    interface SessionData {
        user: User;
    }
}

export interface User {
    address: string;
    name: string;
}