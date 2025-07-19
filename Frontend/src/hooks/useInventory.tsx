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
    refetch
  };
}
