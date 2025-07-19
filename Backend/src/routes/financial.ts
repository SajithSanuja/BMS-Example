import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authorize } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Get financial overview/dashboard
router.get('/overview', authorize(['manager', 'admin']), asyncHandler(async (req: Request, res: Response) => {
  const { start_date, end_date } = req.query;

  try {
    // Get sales data
    let salesQuery = supabase
      .from('sales_orders')
      .select('total_amount, created_at, status');
    
    if (start_date) salesQuery = salesQuery.gte('created_at', start_date);
    if (end_date) salesQuery = salesQuery.lte('created_at', end_date);
    
    const { data: salesData, error: salesError } = await salesQuery;
    
    if (salesError) throw salesError;

    // Get purchase orders data
    let purchaseQuery = supabase
      .from('purchase_orders')
      .select('total_amount, created_at, status');
    
    if (start_date) purchaseQuery = purchaseQuery.gte('created_at', start_date);
    if (end_date) purchaseQuery = purchaseQuery.lte('created_at', end_date);
    
    const { data: purchaseData, error: purchaseError } = await purchaseQuery;
    
    if (purchaseError) throw purchaseError;

    // Calculate metrics
    const totalRevenue = salesData?.reduce((sum, order) => {
      return order.status !== 'cancelled' ? sum + order.total_amount : sum;
    }, 0) || 0;

    const totalExpenses = purchaseData?.reduce((sum, order) => {
      return order.status !== 'cancelled' ? sum + order.total_amount : sum;
    }, 0) || 0;

    const grossProfit = totalRevenue - totalExpenses;
    const salesCount = salesData?.filter(order => order.status !== 'cancelled').length || 0;
    const purchaseCount = purchaseData?.filter(order => order.status !== 'cancelled').length || 0;

    const overview = {
      total_revenue: totalRevenue,
      total_expenses: totalExpenses,
      gross_profit: grossProfit,
      profit_margin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
      sales_count: salesCount,
      purchase_count: purchaseCount,
      average_order_value: salesCount > 0 ? totalRevenue / salesCount : 0
    };

    logger.info('Financial overview retrieved', { userId: req.user?.id });
    res.json({ data: overview });
  } catch (error: any) {
    logger.error('Failed to fetch financial overview', { error: error.message, userId: req.user?.id });
    throw createError('Failed to fetch financial overview', 500);
  }
}));

// Get profit & loss statement
router.get('/profit-loss', authorize(['manager', 'admin']), asyncHandler(async (req: Request, res: Response) => {
  const { start_date, end_date, group_by = 'month' } = req.query;

  try {
    // This would typically involve more complex queries in a real system
    // For now, we'll provide a simplified P&L structure
    
    let salesQuery = supabase
      .from('sales_orders')
      .select('total_amount, created_at, status')
      .neq('status', 'cancelled');
    
    let purchaseQuery = supabase
      .from('purchase_orders')
      .select('total_amount, created_at, status')
      .neq('status', 'cancelled');
    
    if (start_date) {
      salesQuery = salesQuery.gte('created_at', start_date);
      purchaseQuery = purchaseQuery.gte('created_at', start_date);
    }
    if (end_date) {
      salesQuery = salesQuery.lte('created_at', end_date);
      purchaseQuery = purchaseQuery.lte('created_at', end_date);
    }
    
    const [salesResult, purchaseResult] = await Promise.all([
      salesQuery,
      purchaseQuery
    ]);

    const salesData = salesResult.data || [];
    const purchaseData = purchaseResult.data || [];

    // Group data by period
    const groupedData: Record<string, any> = {};

    salesData.forEach(order => {
      const date = new Date(order.created_at);
      const key = group_by === 'month' 
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      if (!groupedData[key]) {
        groupedData[key] = { revenue: 0, expenses: 0, profit: 0 };
      }
      groupedData[key].revenue += order.total_amount;
    });

    purchaseData.forEach(order => {
      const date = new Date(order.created_at);
      const key = group_by === 'month' 
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      if (!groupedData[key]) {
        groupedData[key] = { revenue: 0, expenses: 0, profit: 0 };
      }
      groupedData[key].expenses += order.total_amount;
    });

    // Calculate profit for each period
    Object.keys(groupedData).forEach(key => {
      groupedData[key].profit = groupedData[key].revenue - groupedData[key].expenses;
    });

    const profitLoss = Object.keys(groupedData).sort().map(period => ({
      period,
      ...groupedData[period]
    }));

    logger.info('P&L statement retrieved', { userId: req.user?.id });
    res.json({ data: profitLoss });
  } catch (error: any) {
    logger.error('Failed to fetch P&L statement', { error: error.message, userId: req.user?.id });
    throw createError('Failed to fetch P&L statement', 500);
  }
}));

// Get cash flow summary
router.get('/cash-flow', authorize(['manager', 'admin']), asyncHandler(async (req: Request, res: Response) => {
  const { start_date, end_date } = req.query;

  try {
    // Cash inflows (from sales)
    let salesQuery = supabase
      .from('sales_orders')
      .select('total_amount, created_at, status')
      .in('status', ['delivered', 'completed']);
    
    // Cash outflows (from purchases)
    let purchaseQuery = supabase
      .from('purchase_orders')
      .select('total_amount, created_at, status')
      .in('status', ['delivered', 'completed']);
    
    if (start_date) {
      salesQuery = salesQuery.gte('created_at', start_date);
      purchaseQuery = purchaseQuery.gte('created_at', start_date);
    }
    if (end_date) {
      salesQuery = salesQuery.lte('created_at', end_date);
      purchaseQuery = purchaseQuery.lte('created_at', end_date);
    }
    
    const [salesResult, purchaseResult] = await Promise.all([
      salesQuery,
      purchaseQuery
    ]);

    const cashInflow = salesResult.data?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
    const cashOutflow = purchaseResult.data?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
    const netCashFlow = cashInflow - cashOutflow;

    const cashFlow = {
      cash_inflow: cashInflow,
      cash_outflow: cashOutflow,
      net_cash_flow: netCashFlow,
      inflow_count: salesResult.data?.length || 0,
      outflow_count: purchaseResult.data?.length || 0
    };

    logger.info('Cash flow retrieved', { userId: req.user?.id });
    res.json({ data: cashFlow });
  } catch (error: any) {
    logger.error('Failed to fetch cash flow', { error: error.message, userId: req.user?.id });
    throw createError('Failed to fetch cash flow', 500);
  }
}));

// Get top performing products (by revenue)
router.get('/top-products', authorize(['manager', 'admin']), asyncHandler(async (req: Request, res: Response) => {
  const { limit = 10, start_date, end_date } = req.query;

  try {
    let query = supabase
      .from('sales_order_items')
      .select(`
        inventory_item_id,
        quantity,
        total_price,
        inventory_item:inventory_items(name, sku),
        sales_order:sales_orders(created_at, status)
      `)
      .eq('sales_order.status', 'delivered');

    if (start_date) {
      query = query.gte('sales_order.created_at', start_date);
    }
    if (end_date) {
      query = query.lte('sales_order.created_at', end_date);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group by product and calculate totals
    const productMap: Record<string, any> = {};

    data?.forEach(item => {
      const productId = item.inventory_item_id;
      if (!productMap[productId]) {
        productMap[productId] = {
          inventory_item_id: productId,
          name: 'Product ' + productId, // Simplified for now
          sku: 'SKU-' + productId,
          total_quantity: 0,
          total_revenue: 0,
          order_count: 0
        };
      }
      productMap[productId].total_quantity += item.quantity;
      productMap[productId].total_revenue += item.total_price;
      productMap[productId].order_count += 1;
    });

    // Sort by revenue and limit results
    const topProducts = Object.values(productMap)
      .sort((a: any, b: any) => b.total_revenue - a.total_revenue)
      .slice(0, Number(limit));

    logger.info('Top products retrieved', { count: topProducts.length, userId: req.user?.id });
    res.json({ data: topProducts });
  } catch (error: any) {
    logger.error('Failed to fetch top products', { error: error.message, userId: req.user?.id });
    throw createError('Failed to fetch top products', 500);
  }
}));

// Get financial metrics for a specific period
router.get('/metrics', authorize(['manager', 'admin']), asyncHandler(async (req: Request, res: Response) => {
  const { period = 'month' } = req.query; // month, quarter, year

  try {
    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;

    // Calculate date ranges based on period
    switch (period) {
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        previousStartDate = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
        break;
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        break;
    }

    // Get current period data
    const currentSalesQuery = supabase
      .from('sales_orders')
      .select('total_amount, status')
      .gte('created_at', startDate.toISOString())
      .neq('status', 'cancelled');

    const currentPurchasesQuery = supabase
      .from('purchase_orders')
      .select('total_amount, status')
      .gte('created_at', startDate.toISOString())
      .neq('status', 'cancelled');

    // Get previous period data for comparison
    const previousSalesQuery = supabase
      .from('sales_orders')
      .select('total_amount, status')
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString())
      .neq('status', 'cancelled');

    const [currentSales, currentPurchases, previousSales] = await Promise.all([
      currentSalesQuery,
      currentPurchasesQuery,
      previousSalesQuery
    ]);

    const currentRevenue = currentSales.data?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
    const currentExpenses = currentPurchases.data?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
    const previousRevenue = previousSales.data?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

    const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    const metrics = {
      current_period: {
        revenue: currentRevenue,
        expenses: currentExpenses,
        profit: currentRevenue - currentExpenses,
        order_count: currentSales.data?.length || 0
      },
      previous_period: {
        revenue: previousRevenue
      },
      growth: {
        revenue_growth_percentage: revenueGrowth
      },
      period: period
    };

    logger.info('Financial metrics retrieved', { period, userId: req.user?.id });
    res.json({ data: metrics });
  } catch (error: any) {
    logger.error('Failed to fetch financial metrics', { error: error.message, userId: req.user?.id });
    throw createError('Failed to fetch financial metrics', 500);
  }
}));

export default router;
