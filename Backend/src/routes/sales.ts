import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

// Get all sales orders
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { status, customer_id, limit = 50, offset = 0 } = req.query;

  let query = supabase
    .from('sales_orders')
    .select(`
      *,
      customer:customers(id, name, email),
      sales_order_items(
        id, quantity, unit_price, total_price,
        inventory_item:inventory_items(id, name, sku)
      )
    `)
    .order('created_at', { ascending: false });

  // Apply filters
  if (status) {
    query = query.eq('status', status);
  }
  if (customer_id) {
    query = query.eq('customer_id', customer_id);
  }

  // Apply pagination
  query = query.range(Number(offset), Number(offset) + Number(limit) - 1);

  const { data, error } = await query;

  if (error) {
    logger.error('Failed to fetch sales orders', { error: error.message, userId: req.user?.id });
    throw createError('Failed to fetch sales orders', 500);
  }

  logger.info('Sales orders retrieved', { count: data?.length, userId: req.user?.id });
  res.json({ data: data || [] });
}));

// Get single sales order
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('sales_orders')
    .select(`
      *,
      customer:customers(id, name, email, address, phone),
      sales_order_items(
        id, quantity, unit_price, total_price,
        inventory_item:inventory_items(id, name, sku, description)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Sales order not found' });
    }
    logger.error('Failed to fetch sales order', { error: error.message, userId: req.user?.id, orderId: id });
    throw createError('Failed to fetch sales order', 500);
  }

  logger.info('Sales order retrieved', { orderId: id, userId: req.user?.id });
  res.json({ data });
}));

// Create new sales order
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { customer_id, items, notes, delivery_address } = req.body;

  // Validate input
  if (!customer_id || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Customer ID and items are required' });
  }

  // Start transaction
  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .insert({
      customer_id,
      status: 'pending',
      total_amount: 0, // Will be calculated after inserting items
      notes,
      delivery_address,
      created_by: req.user?.id
    })
    .select()
    .single();

  if (orderError) {
    logger.error('Failed to create sales order', { error: orderError.message, userId: req.user?.id });
    throw createError('Failed to create sales order', 500);
  }

  // Insert order items and calculate total
  let totalAmount = 0;
  const orderItems = [];

  for (const item of items) {
    const { inventory_item_id, quantity } = item;

    // Get item details
    const { data: inventoryItem, error: itemError } = await supabase
      .from('inventory_items')
      .select('selling_price, current_stock')
      .eq('id', inventory_item_id)
      .single();

    if (itemError || !inventoryItem) {
      // Rollback order creation
      await supabase.from('sales_orders').delete().eq('id', order.id);
      return res.status(400).json({ error: `Invalid inventory item: ${inventory_item_id}` });
    }

    // Check stock availability
    if (inventoryItem.current_stock < quantity) {
      // Rollback order creation
      await supabase.from('sales_orders').delete().eq('id', order.id);
      return res.status(400).json({ 
        error: `Insufficient stock for item ${inventory_item_id}. Available: ${inventoryItem.current_stock}, Requested: ${quantity}` 
      });
    }

    const unitPrice = inventoryItem.selling_price;
    const totalPrice = unitPrice * quantity;
    totalAmount += totalPrice;

    // Insert order item
    const { data: orderItem, error: orderItemError } = await supabase
      .from('sales_order_items')
      .insert({
        sales_order_id: order.id,
        inventory_item_id,
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice
      })
      .select()
      .single();

    if (orderItemError) {
      // Rollback order creation
      await supabase.from('sales_orders').delete().eq('id', order.id);
      logger.error('Failed to create order item', { error: orderItemError.message, userId: req.user?.id });
      throw createError('Failed to create order item', 500);
    }

    orderItems.push(orderItem);
  }

  // Update order with total amount
  const { error: updateError } = await supabase
    .from('sales_orders')
    .update({ total_amount: totalAmount })
    .eq('id', order.id);

  if (updateError) {
    // Rollback order creation
    await supabase.from('sales_orders').delete().eq('id', order.id);
    logger.error('Failed to update order total', { error: updateError.message, userId: req.user?.id });
    throw createError('Failed to update order total', 500);
  }

  // Get complete order data
  const { data: completeOrder } = await supabase
    .from('sales_orders')
    .select(`
      *,
      customer:customers(id, name, email),
      sales_order_items(
        id, quantity, unit_price, total_price,
        inventory_item:inventory_items(id, name, sku)
      )
    `)
    .eq('id', order.id)
    .single();

  logger.info('Sales order created', { orderId: order.id, totalAmount, userId: req.user?.id });
  res.status(201).json({ data: completeOrder });
}));

// Update sales order status
router.patch('/:id/status', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const updateData: any = { status };
  if (notes) updateData.notes = notes;

  const { data, error } = await supabase
    .from('sales_orders')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Sales order not found' });
    }
    logger.error('Failed to update order status', { error: error.message, userId: req.user?.id, orderId: id });
    throw createError('Failed to update order status', 500);
  }

  logger.info('Sales order status updated', { orderId: id, status, userId: req.user?.id });
  res.json({ data });
}));

// Cancel sales order
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if order can be cancelled
  const { data: order, error: fetchError } = await supabase
    .from('sales_orders')
    .select('status')
    .eq('id', id)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return res.status(404).json({ error: 'Sales order not found' });
    }
    throw createError('Failed to fetch order', 500);
  }

  if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
    return res.status(400).json({ error: `Cannot cancel order with status: ${order.status}` });
  }

  const { data, error } = await supabase
    .from('sales_orders')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Failed to cancel order', { error: error.message, userId: req.user?.id, orderId: id });
    throw createError('Failed to cancel order', 500);
  }

  logger.info('Sales order cancelled', { orderId: id, userId: req.user?.id });
  res.json({ message: 'Order cancelled successfully', data });
}));

// Get sales analytics
router.get('/analytics/summary', asyncHandler(async (req: Request, res: Response) => {
  const { start_date, end_date } = req.query;

  // Base query for date range
  let query = supabase.from('sales_orders').select('status, total_amount, created_at');
  
  if (start_date) {
    query = query.gte('created_at', start_date);
  }
  if (end_date) {
    query = query.lte('created_at', end_date);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Failed to fetch sales analytics', { error: error.message, userId: req.user?.id });
    throw createError('Failed to fetch sales analytics', 500);
  }

  // Calculate summary statistics
  const summary = {
    total_orders: data?.length || 0,
    total_revenue: data?.reduce((sum, order) => sum + order.total_amount, 0) || 0,
    orders_by_status: {} as Record<string, number>,
    average_order_value: 0
  };

  // Group by status
  data?.forEach(order => {
    if (!summary.orders_by_status[order.status]) {
      summary.orders_by_status[order.status] = 0;
    }
    summary.orders_by_status[order.status]++;
  });

  // Calculate average order value
  if (summary.total_orders > 0) {
    summary.average_order_value = summary.total_revenue / summary.total_orders;
  }

  logger.info('Sales analytics retrieved', { userId: req.user?.id });
  res.json({ data: summary });
}));

export default router;
