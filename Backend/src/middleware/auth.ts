import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        profile: any;
      };
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn('Invalid token attempt', { error: error?.message, ip: req.ip });
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user profile with role information
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      logger.warn('User profile not found', { userId: user.id, error: profileError?.message });
      return res.status(401).json({ error: 'User profile not found' });
    }

    if (!profile.is_active) {
      return res.status(401).json({ error: 'User account is inactive' });
    }

    // Attach user context to request
    req.user = {
      id: user.id,
      email: user.email!,
      role: profile.role,
      profile
    };

    next();
  } catch (error) {
    logger.error('Authentication error', { error: error instanceof Error ? error.message : 'Unknown error', ip: req.ip });
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// Authorization middleware for role-based access
export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Unauthorized access attempt', { 
        userId: req.user.id, 
        role: req.user.role, 
        requiredRoles: allowedRoles,
        path: req.path 
      });
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};
