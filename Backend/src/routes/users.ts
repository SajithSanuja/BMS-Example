import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authorize } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Get all users (Admin/Manager only)
router.get('/', authorize(['admin', 'manager']), asyncHandler(async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, full_name, role, is_active, created_at')
    .order('full_name');

  if (error) {
    logger.error('Failed to fetch users', { error: error.message, userId: req.user?.id });
    throw createError('Failed to fetch users', 500);
  }

  logger.info('Users retrieved', { count: data?.length, userId: req.user?.id });
  res.json({ data: data || [] });
}));

// Get single user (Admin/Manager only)
router.get('/:id', authorize(['admin', 'manager']), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, full_name, role, is_active, created_at')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'User not found' });
    }
    logger.error('Failed to fetch user', { error: error.message, userId: req.user?.id, targetUserId: id });
    throw createError('Failed to fetch user', 500);
  }

  logger.info('User retrieved', { targetUserId: id, userId: req.user?.id });
  res.json({ data });
}));

// Update user (Admin only)
router.put('/:id', authorize(['admin']), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { full_name, role, is_active } = req.body;

  // Validate input
  if (!full_name && !role && is_active === undefined) {
    return res.status(400).json({ error: 'At least one field must be provided for update' });
  }

  const updateData: any = {};
  if (full_name) updateData.full_name = full_name;
  if (role) updateData.role = role;
  if (is_active !== undefined) updateData.is_active = is_active;

  const { data, error } = await supabase
    .from('user_profiles')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'User not found' });
    }
    logger.error('Failed to update user', { error: error.message, userId: req.user?.id, targetUserId: id });
    throw createError('Failed to update user', 500);
  }

  logger.info('User updated', { targetUserId: id, userId: req.user?.id, updates: updateData });
  res.json({ data });
}));

// Deactivate user (Admin only) - soft delete
router.delete('/:id', authorize(['admin']), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Prevent self-deletion
  if (req.user?.id === id) {
    return res.status(400).json({ error: 'Cannot deactivate your own account' });
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .update({ is_active: false })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'User not found' });
    }
    logger.error('Failed to deactivate user', { error: error.message, userId: req.user?.id, targetUserId: id });
    throw createError('Failed to deactivate user', 500);
  }

  logger.info('User deactivated', { targetUserId: id, userId: req.user?.id });
  res.json({ message: 'User deactivated successfully', data });
}));

// Get user activity/audit log (Admin only)
router.get('/:id/activity', authorize(['admin']), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { limit = 50, offset = 0 } = req.query;

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  if (error) {
    logger.error('Failed to fetch user activity', { error: error.message, userId: req.user?.id, targetUserId: id });
    throw createError('Failed to fetch user activity', 500);
  }

  logger.info('User activity retrieved', { targetUserId: id, count: data?.length, userId: req.user?.id });
  res.json({ data: data || [] });
}));

export default router;
