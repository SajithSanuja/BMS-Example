import { useState, useEffect } from 'react';
import { PurchaseOrder, PurchaseOrderStatus, Supplier, PurchaseItem } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useSuppliers } from './useSuppliers';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export const usePurchaseOrders = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { suppliers } = useSuppliers();

  const fetchPurchaseOrders = async () => {
    setIsLoading(true);
    
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching purchase orders:', ordersError);
        throw ordersError;
      }

      console.log('Raw orders data from database:', ordersData);

      const { data: itemsData, error: itemsError } = await supabase
        .from('purchase_order_items')
        .select(`
          *,
          inventory_item:inventory_items(name, sku)
        `);

      if (itemsError) {
        console.error('Error fetching purchase order items:', itemsError);
        // Don't throw error here, just log it and continue with empty items
        console.warn('Continuing with empty items array');
      }

      console.log('Raw items data from database:', itemsData);

      const formattedOrders: PurchaseOrder[] = ordersData.map(order => {
        const orderItems = (itemsData || [])
          .filter(item => item.purchase_order_id === order.id)
          .map(item => ({
            id: item.id,
            name: item.inventory_item?.name || item.name || 'Unknown Item',
            quantity: item.quantity,
            unitCost: item.unit_cost,
            totalCost: item.total_cost,
            receivedQuantity: item.received_quantity || 0
          }));

        // Handle case where supplier might be null
        const supplier: Supplier = order.supplier ? {
          id: order.supplier.id,
          name: order.supplier.name,
          telephone: order.supplier.telephone || '',
          address: order.supplier.address || '',
          paymentTerms: order.supplier.payment_terms || '',
          createdAt: new Date(order.supplier.created_at)
        } : {
          id: order.supplier_id,
          name: 'Unknown Supplier',
          telephone: '',
          address: '',
          paymentTerms: '',
          createdAt: new Date()
        };

        return {
          id: order.id,
          orderNumber: order.order_number,
          supplier,
          items: orderItems,
          totalAmount: order.total_amount,
          status: order.status as PurchaseOrderStatus,
          createdAt: new Date(order.created_at),
          updatedAt: new Date(order.updated_at),
          expectedDeliveryDate: order.expected_delivery_date ? new Date(order.expected_delivery_date) : undefined,
          notes: order.notes || ''
        };
      });

      setPurchaseOrders(formattedOrders);
      console.log('Purchase orders loaded from database:', formattedOrders);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
      toast.error('Failed to load purchase orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const addPurchaseOrder = async (supplierId: string, items: PurchaseItem[], notes?: string) => {
    setIsLoading(true);
    
    try {
      const supplier = suppliers.find(s => s.id === supplierId);
      
      if (!supplier) {
        throw new Error('Supplier not found');
      }
      
      const totalAmount = items.reduce((sum, item) => sum + item.totalCost, 0);
      const orderNumber = `PO-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
      
      const { data: orderData, error: orderError } = await supabase
        .from('purchase_orders')
        .insert({
          order_number: orderNumber,
          supplier_id: supplierId,
          total_amount: totalAmount,
          status: 'draft',
          notes
        })
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }

      // First, let's check the table structure to see if item_id column exists
      const { data: tableInfo, error: tableError } = await supabase
        .from('purchase_order_items')
        .select()
        .limit(1);

      const orderItems = await Promise.all(
        items.map(async item => {
          // Try to find the inventory item by name first
          const { data: inventoryItems, error: inventoryError } = await supabase
            .from('inventory_items')
            .select('id, name')
            .eq('name', item.name);

          if (inventoryError) {
            console.warn('Could not fetch inventory items:', inventoryError);
          }

          const inventoryItem = inventoryItems?.[0];

          try {
            // Try inserting with item_id first (new schema)
            if (inventoryItem) {
              const { data: itemData, error: itemError } = await supabase
                .from('purchase_order_items')
                .insert({
                  purchase_order_id: orderData.id,
                  item_id: inventoryItem.id,
                  quantity: item.quantity,
                  unit_cost: item.unitCost,
                  total_cost: item.totalCost
                })
                .select()
                .single();

              if (!itemError) {
                return {
                  id: itemData.id,
                  name: item.name,
                  quantity: itemData.quantity,
                  unitCost: itemData.unit_cost,
                  totalCost: itemData.total_cost,
                  receivedQuantity: itemData.received_quantity || 0
                };
              }
            }

            // If item_id insert fails, fall back to name-based insert (old schema)
            const { data: itemData, error: itemError } = await supabase
              .from('purchase_order_items')
              .insert({
                purchase_order_id: orderData.id,
                name: item.name,
                quantity: item.quantity,
                unit_cost: item.unitCost,
                total_cost: item.totalCost
              })
              .select()
              .single();

            if (itemError) {
              throw itemError;
            }

            return {
              id: itemData.id,
              name: item.name,
              quantity: itemData.quantity,
              unitCost: itemData.unit_cost,
              totalCost: itemData.total_cost,
              receivedQuantity: itemData.received_quantity || 0
            };

          } catch (insertError) {
            console.error('Error inserting purchase order item:', insertError);
            throw insertError;
          }
        })
      );

      const newPO: PurchaseOrder = {
        id: orderData.id,
        orderNumber: orderData.order_number,
        supplier,
        items: orderItems,
        totalAmount: orderData.total_amount,
        status: orderData.status as PurchaseOrderStatus,
        createdAt: new Date(orderData.created_at),
        updatedAt: new Date(orderData.updated_at),
        notes: orderData.notes || ''
      };
      
      console.log('Creating new purchase order:', newPO);
      setPurchaseOrders(prevPOs => [newPO, ...prevPOs]);
      toast.success('Purchase order created successfully');
      setIsLoading(false);
      return newPO;
    } catch (error) {
      console.error('Error adding purchase order:', error);
      toast.error(`Failed to create purchase order: ${(error as Error).message}`);
      setIsLoading(false);
      throw error;
    }
  };

  const updatePurchaseOrderStatus = async (id: string, status: PurchaseOrderStatus) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .update({ status })
        .eq('id', id);

      if (error) {
        throw error;
      }

      setPurchaseOrders(prevPOs => 
        prevPOs.map(po => 
          po.id === id ? { ...po, status, updatedAt: new Date() } : po
        )
      );
      console.log('Updated purchase order status for ID:', id, 'New status:', status);
      toast.success(`Purchase order status updated to ${status}`);
      setIsLoading(false);
    } catch (error) {
      console.error('Error updating purchase order status:', error);
      toast.error(`Failed to update status: ${(error as Error).message}`);
      setIsLoading(false);
      throw error;
    }
  };

  const deletePurchaseOrder = async (id: string) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setPurchaseOrders(prevPOs => prevPOs.filter(po => po.id !== id));
      console.log('Deleted purchase order with ID:', id);
      toast.success('Purchase order deleted successfully');
      setIsLoading(false);
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      toast.error(`Failed to delete purchase order: ${(error as Error).message}`);
      setIsLoading(false);
      throw error;
    }
  };

  const getPurchaseOrderById = (id: string): PurchaseOrder | undefined => {
    return purchaseOrders.find(po => po.id === id);
  };

  // Alias methods to match what's used in PurchaseOrderDetail
  const getOrderById = getPurchaseOrderById;
  const updateOrderStatus = updatePurchaseOrderStatus;

  // Add PDF export functionality
  const exportOrderToPdf = async (id: string) => {
    try {
      const order = getPurchaseOrderById(id);
      if (!order) {
        throw new Error('Purchase order not found');
      }
      
      // Use the new PDF generator
      const { generatePurchaseOrderPDF } = await import('@/lib/pdfGenerator');
      generatePurchaseOrderPDF(order);
      
      toast.success('Purchase order exported to PDF successfully');
      return true;
    } catch (error) {
      console.error('Error exporting purchase order to PDF:', error);
      toast.error(`Failed to export purchase order: ${(error as Error).message}`);
      throw error;
    }
  };

  // Add Excel export functionality for all purchase orders
  const exportOrdersToExcel = () => {
    try {
      // Prepare data for Excel export
      const exportData = purchaseOrders.map(order => ({
        'Order Number': order.orderNumber,
        'Supplier': order.supplier.name,
        'Total Amount': `$${order.totalAmount.toFixed(2)}`,
        'Status': order.status,
        'Date Created': new Date(order.createdAt).toLocaleDateString(),
        'Date Updated': new Date(order.updatedAt).toLocaleDateString(),
        'Items Count': order.items.length
      }));
      
      // Create workbook and add worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchase Orders');
      
      // Generate Excel file and trigger download
      XLSX.writeFile(workbook, 'purchase_orders.xlsx');
      
      toast.success('Purchase orders exported to Excel successfully');
      return true;
    } catch (error) {
      console.error('Error exporting purchase orders to Excel:', error);
      toast.error(`Failed to export purchase orders: ${(error as Error).message}`);
      throw error;
    }
  };

  return {
    purchaseOrders,
    isLoading,
    addPurchaseOrder,
    updatePurchaseOrderStatus,
    deletePurchaseOrder,
    getPurchaseOrderById,
    // Add aliases and new methods
    getOrderById,
    updateOrderStatus,
    exportOrderToPdf,
    exportOrdersToExcel,
    refreshPurchaseOrders: fetchPurchaseOrders
  };
};
