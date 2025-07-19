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
        supabaseUser: any;
      };
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'No token provided',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn('Invalid token attempt', { 
        error: error?.message, 
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    // Get user profile with role information
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      logger.warn('User profile not found', { 
        userId: user.id, 
        error: profileError?.message 
      });
      return res.status(401).json({ 
        error: 'User profile not found',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    if (!profile.is_active) {
      logger.warn('Inactive user access attempt', { 
        userId: user.id, 
        email: user.email 
      });
      return res.status(403).json({ 
        error: 'User account is inactive',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Attach user information to request
    req.user = {
      id: user.id,
      email: user.email!,
      role: profile.role,
      profile: profile,
      supabaseUser: user
    };

    logger.info('Authenticated request', { 
      userId: user.id, 
      email: user.email,
      role: profile.role,
      endpoint: req.path,
      method: req.method
    });

    next();
  } catch (error) {
    logger.error('Auth middleware error', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip 
    });
    return res.status(500).json({ 
      error: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};

// Role-based authorization middleware
export const requireRole = (allowedRoles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!roles.includes(req.user.role)) {
      logger.warn('Insufficient permissions', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        endpoint: req.path
      });
      
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
};

// Convenience middleware for common roles
export const requireAdmin = requireRole('admin');
export const requireManager = requireRole(['admin', 'manager']);
export const requireEmployee = requireRole(['admin', 'manager', 'employee']);
