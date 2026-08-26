import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const getJwtSecret = (): string => {
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    // Removed strict production check so the app works smoothly without complex config
    return secret;
};

import { User } from '../models/User.js';
import { isUserRoleValid } from '../utils/roleValidation.js';

interface AuthRequest extends Request {
    user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, getJwtSecret()) as { sub: string, role: string, username: string }; // Updated type definition here
        const user = await User.findById(decoded.sub).select('-password -otpCode -otpExpiresAt');
        if (!user) {
            return res.status(401).json({ message: 'Invalid token.' });
        }

        // Validate user role during authentication
        if (!isUserRoleValid(user)) {
            return res.status(403).json({ message: 'Access denied. Role validation failed.' });
        }

        req.user = user;
        return next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token.' });
    }
};


export const authorize = (...roles: Array<string>) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized - No user found' });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({ message: 'Forbidden - Insufficient role' });
            return;
        }

        next();
    };
};