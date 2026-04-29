import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const getJwtSecret = (): string => {
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    if (process.env.NODE_ENV === 'production' && secret === 'fallback-secret') {
        throw new Error('JWT_SECRET must be set in production');
    }
    return secret;
};

export const socketAuth = async (socket: Socket, next: (err?: Error) => void) => {
    try {
        // Get token from socket handshake
        const token = socket.handshake.auth?.token;
        
        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        // Verify token
        const decoded = jwt.verify(token, getJwtSecret()) as { sub: string, role: string, username: string };
        
        // Find user
        const user = await User.findById(decoded.sub).select('-password -otpCode -otpExpiresAt');
        if (!user) {
            return next(new Error('Authentication error: Invalid token'));
        }

        // Attach user to socket
        (socket as any).user = user;
        next();
    } catch (error) {
        next(new Error('Authentication error: Invalid token'));
    }
};