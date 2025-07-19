import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

// Register new user
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { email, password, fullName, role = 'employee' } = req.body;

  // Validate input
  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Email, password, and full name are required' });
  }

  // Create user with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName
    }
  });

  if (authError) {
    logger.error('User registration failed', { error: authError.message, email });
    return res.status(400).json({ error: authError.message });
  }

  // Create user profile
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      id: authData.user.id,
      full_name: fullName,
      role,
      is_active: true
    });

  if (profileError) {
    logger.error('User profile creation failed', { error: profileError.message, userId: authData.user.id });
    // Cleanup: delete the auth user if profile creation fails
    await supabase.auth.admin.deleteUser(authData.user.id);
    return res.status(500).json({ error: 'Failed to create user profile' });
  }

  logger.info('User registered successfully', { userId: authData.user.id, email });

  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: authData.user.id,
      email: authData.user.email,
      fullName
    }
  });
}));

// Login user
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    logger.warn('Login attempt failed', { error: error.message, email, ip: req.ip });
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile) {
    logger.error('User profile not found during login', { userId: data.user.id, error: profileError?.message });
    return res.status(401).json({ error: 'User profile not found' });
  }

  if (!profile.is_active) {
    return res.status(401).json({ error: 'User account is inactive' });
  }

  logger.info('User logged in successfully', { userId: data.user.id, email });

  res.json({
    message: 'Login successful',
    user: {
      id: data.user.id,
      email: data.user.email,
      fullName: profile.full_name,
      role: profile.role
    },
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at
    }
  });
}));

// Refresh token
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token
  });

  if (error || !data.session) {
    logger.warn('Token refresh failed', { error: error?.message || 'No session data', ip: req.ip });
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  res.json({
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at
    }
  });
}));

// Logout user
router.post('/logout', asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    // Sign out the user
    await supabase.auth.admin.signOut(token);
  }

  res.json({ message: 'Logged out successfully' });
}));

// Get current user profile
router.get('/me', asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return res.status(404).json({ error: 'User profile not found' });
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: profile.full_name,
      role: profile.role,
      isActive: profile.is_active,
      createdAt: profile.created_at
    }
  });
}));

export default router;
