import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authMiddleware, requireEmployee, requireManager } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all inventory items
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .order('name');

  if (error) {
    logger.error('Failed to fetch inventory items', { error: error.message, userId: req.user?.id });
    throw createError('Failed to fetch inventory items', 500);
  }

  res.json({ data });
}));

// Get single inventory item
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    logger.error('Failed to fetch inventory item', { error: error.message, itemId: id, userId: req.user?.id });
    throw createError('Item not found', 404);
  }

  res.json({ data });
}));

// Create new inventory item (Manager only)
router.post('/', requireManager, asyncHandler(async (req: Request, res: Response) => {
  const {
    name,
    description,
    category,
    unit_of_measure,
    purchase_cost,
    selling_price,
    current_stock,
    reorder_level,
    sku
  } = req.body;

  // Validate required fields
  if (!name || !category || !unit_of_measure || !sku) {
    throw createError('Name, category, unit of measure, and SKU are required', 400);
  }

  const { data, error } = await supabase
    .from('inventory_items')
    .insert({
      name,
      description,
      category,
      unit_of_measure,
      purchase_cost: purchase_cost || 0,
      selling_price: selling_price || 0,
      current_stock: current_stock || 0,
      reorder_level: reorder_level || 0,
      sku,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create inventory item', { error: error.message, userId: req.user?.id });
    throw createError('Failed to create inventory item', 500);
  }

  logger.info('Inventory item created', { itemId: data.id, name, userId: req.user?.id });

  res.status(201).json({ data });
}));

// Update inventory item (Manager only)
router.put('/:id', requireManager, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  // Remove fields that shouldn't be updated directly
  delete updateData.id;
  delete updateData.created_at;

  const { data, error } = await supabase
    .from('inventory_items')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Failed to update inventory item', { error: error.message, itemId: id, userId: req.user?.id });
    throw createError('Failed to update inventory item', 500);
  }

  logger.info('Inventory item updated', { itemId: id, userId: req.user?.id });

  res.json({ data });
}));

// Delete inventory item (Manager only)
router.delete('/:id', requireManager, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Soft delete by setting is_active to false
  const { data, error } = await supabase
    .from('inventory_items')
    .update({ 
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Failed to delete inventory item', { error: error.message, itemId: id, userId: req.user?.id });
    throw createError('Failed to delete inventory item', 500);
  }

  logger.info('Inventory item deleted', { itemId: id, userId: req.user?.id });

  res.json({ message: 'Item deleted successfully', data });
}));

// Update stock level
router.patch('/:id/stock', requireManager, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { quantity, operation = 'set' } = req.body; // operation: 'set', 'add', 'subtract'

  if (typeof quantity !== 'number') {
    throw createError('Quantity must be a number', 400);
  }

  // Get current stock
  const { data: currentItem, error: fetchError } = await supabase
    .from('inventory_items')
    .select('current_stock')
    .eq('id', id)
    .single();

  if (fetchError) {
    throw createError('Item not found', 404);
  }

  let newStock: number;
  switch (operation) {
    case 'add':
      newStock = currentItem.current_stock + quantity;
      break;
    case 'subtract':
      newStock = Math.max(0, currentItem.current_stock - quantity);
      break;
    case 'set':
    default:
      newStock = Math.max(0, quantity);
      break;
  }

  const { data, error } = await supabase
    .from('inventory_items')
    .update({ 
      current_stock: newStock,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Failed to update stock', { error: error.message, itemId: id, userId: req.user?.id });
    throw createError('Failed to update stock', 500);
  }

  logger.info('Stock updated', { 
    itemId: id, 
    oldStock: currentItem.current_stock, 
    newStock, 
    operation, 
    quantity,
    userId: req.user?.id 
  });

  res.json({ data });
}));

// Get low stock items
router.get('/alerts/low-stock', asyncHandler(async (req: Request, res: Response) => {
  // Get all items first, then filter in JavaScript (for now)
  // TODO: Use a database view or stored procedure for better performance
  const { data: allItems, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('is_active', true)
    .order('current_stock');

  if (error) {
    logger.error('Failed to fetch inventory items', { error: error.message, userId: req.user?.id });
    throw createError('Failed to fetch inventory items', 500);
  }

  // Filter items where current_stock <= reorder_level
  const lowStockItems = allItems?.filter(item => item.current_stock <= item.reorder_level) || [];

  logger.info('Low stock items retrieved', { count: lowStockItems.length, userId: req.user?.id });
  res.json({ data: lowStockItems });
}));

export default router;
