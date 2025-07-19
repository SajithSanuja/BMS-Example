import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { InventoryItem, InventoryAdjustment, UnitOfMeasure } from '@/types';
import { 
  useGetInventoryItemsQuery,
  useCreateInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation
} from '@/store/api/inventoryApi';

export function useInventory() {
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
  
  // Use Redux API queries
  const { data: inventoryResponse, isLoading, refetch } = useGetInventoryItemsQuery();
  const [createInventoryItem] = useCreateInventoryItemMutation();
  const [updateInventoryItem] = useUpdateInventoryItemMutation();
  const [deleteInventoryItem] = useDeleteInventoryItemMutation();

  const items = inventoryResponse?.data || [];

  const addItem = useCallback(async (itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const result = await createInventoryItem({
        name: itemData.name,
        description: itemData.description,
        category: itemData.category,
        unit_of_measure: itemData.unitOfMeasure,
        purchase_cost: itemData.purchaseCost,
        selling_price: itemData.sellingPrice,
        current_stock: itemData.currentStock,
        reorder_level: itemData.reorderLevel,
        sku: itemData.sku || ''
      }).unwrap();

      toast.success('Inventory item added successfully');
      return result.data;
    } catch (error: any) {
      console.error('Error adding inventory item:', error);
      toast.error(error?.data?.error || 'Failed to add inventory item');
      throw error;
    }
  }, [createInventoryItem]);

  const updateItem = useCallback(async (id: string, itemData: Partial<InventoryItem>) => {
    try {
      const result = await updateInventoryItem({
        id,
        updates: itemData
      }).unwrap();

      toast.success('Inventory item updated successfully');
      return result.data;
    } catch (error: any) {
      console.error('Error updating inventory item:', error);
      toast.error(error?.data?.error || 'Failed to update inventory item');
      throw error;
    }
  }, [updateInventoryItem]);

  const deleteItem = useCallback(async (id: string) => {
    try {
      await deleteInventoryItem(id).unwrap();
      toast.success('Inventory item deleted successfully');
    } catch (error: any) {
      console.error('Error deleting inventory item:', error);
      toast.error(error?.data?.error || 'Failed to delete inventory item');
      throw error;
    }
  }, [deleteInventoryItem]);

  const getItemById = useCallback((id: string) => {
    return items.find((item) => item.id === id);
  }, [items]);

  // Adjustment-related methods
  const createInventoryAdjustment = useCallback(async (adjustmentData: {
    itemId: string;
    previousQuantity: number;
    newQuantity: number;
    reason: string;
    notes?: string;
  }) => {
    try {
      console.log('Creating inventory adjustment:', adjustmentData);
      
      // For now, we'll update the item stock directly
      // In a full implementation, this would also create an adjustment record
      const quantityChange = adjustmentData.newQuantity - adjustmentData.previousQuantity;
      
      await updateItem(adjustmentData.itemId, { 
        currentStock: adjustmentData.newQuantity 
      });

      // Create a mock adjustment for the UI
      const mockAdjustment = {
        id: Date.now().toString(),
        itemId: adjustmentData.itemId,
        previousQuantity: adjustmentData.previousQuantity,
        newQuantity: adjustmentData.newQuantity,
        reason: adjustmentData.reason as any,
        notes: adjustmentData.notes || '',
        createdBy: 'current-user',
        adjustmentDate: new Date(),
        item: getItemById(adjustmentData.itemId)!
      };

      setAdjustments(prev => [mockAdjustment, ...prev]);
      toast.success('Inventory adjustment created successfully');
      
      return mockAdjustment;
    } catch (error: any) {
      console.error('Error creating inventory adjustment:', error);
      toast.error(error?.message || 'Failed to create inventory adjustment');
      throw error;
    }
  }, [updateItem, getItemById]);

  const fetchAdjustments = useCallback(async () => {
    // For now, this is a placeholder
    // In a full implementation, this would fetch from an API
    console.log('Fetching adjustments...');
  }, []);

  // For now, stock updates will be done through updateItem
  const updateItemStock = useCallback(async (id: string, newStock: number) => {
    const item = getItemById(id);
    if (!item) throw new Error('Item not found');

    return updateItem(id, { currentStock: newStock });
  }, [updateItem, getItemById]);

  return {
    items,
    adjustments,
    isLoading,
    addItem,
    updateItem,
    deleteItem,
    getItemById,
    updateItemStock,
    createInventoryAdjustment,
    fetchAdjustments,
    refetch
  };
}
