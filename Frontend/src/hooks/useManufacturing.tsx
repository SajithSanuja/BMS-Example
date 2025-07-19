
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { BOM, Material, ProductionOrder, ProductionStatus, InventoryItem } from '@/types';
import { useInventory } from './useInventory';

export function useManufacturing() {
  const [boms, setBoms] = useState<BOM[]>([]);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const { items: inventoryItems, updateItemStock } = useInventory();

  const fetchBOMs = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('boms')
        .select(`
          *,
          bom_materials(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedBOMs: BOM[] = data.map(bom => ({
        id: bom.id,
        productName: bom.product_name,
        description: bom.description || '',
        finishedItemId: bom.finished_item_id || undefined,
        materials: bom.bom_materials.map((material: any) => ({
          id: material.id,
          itemId: material.item_id,
          name: inventoryItems.find(item => item.id === material.item_id)?.name || 'Unknown Item',
          quantity: material.quantity,
          unitOfMeasure: material.unit_of_measure
        })),
        createdAt: new Date(bom.created_at)
      }));

      setBoms(transformedBOMs);
      console.log('BOMs loaded:', data.length);
    } catch (error) {
      console.error('Error fetching BOMs:', error);
      toast.error('Failed to load BOMs');
    } finally {
      setIsLoading(false);
    }
  }, [inventoryItems]);

  const fetchProductionOrders = useCallback(async (forceRefresh = false) => {
    if (isInitialized && !forceRefresh && productionOrders.length > 0) {
      return productionOrders;
    }
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('production_orders')
        .select(`
          *,
          boms(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedOrders: ProductionOrder[] = data.map(order => ({
        id: order.id,
        bomId: order.bom_id,
        bom: boms.find(bom => bom.id === order.bom_id),
        quantityToProduce: order.quantity_to_produce,
        status: order.status as ProductionStatus,
        startDate: new Date(order.start_date),
        laborCost: order.labor_cost || 0,
        additionalCosts: order.additional_costs || 0,
        totalCost: (order.labor_cost || 0) + (order.additional_costs || 0),
        materialsIssued: false,
        batchId: order.batch_id,
        createdAt: new Date(order.created_at),
        completionDate: order.completion_date ? new Date(order.completion_date) : undefined,
        orderNumber: `PO-${new Date(order.created_at).getFullYear()}-${order.id.substring(0, 4)}`
      }));

      setProductionOrders(transformedOrders);
      setIsInitialized(true);
      console.log('Production orders loaded:', data.length);
      return transformedOrders;
    } catch (error) {
      console.error('Error fetching production orders:', error);
      toast.error('Failed to load production orders');
      return productionOrders;
    } finally {
      setIsLoading(false);
    }
  }, [boms, isInitialized, productionOrders.length]);

  useEffect(() => {
    const loadData = async () => {
      await fetchBOMs();
      await fetchProductionOrders();
    };
    
    loadData();
  }, [fetchBOMs, fetchProductionOrders]);

  const addBOM = useCallback(async (
    productName: string, 
    description: string, 
    materials: Omit<Material, 'name'>[],
    finishedItemId?: string
  ) => {
    try {
      setIsLoading(true);
      
      const { data: bomData, error: bomError } = await supabase.from('boms').insert({
        product_name: productName,
        description: description,
        finished_item_id: finishedItemId
      }).select().single();

      if (bomError) throw bomError;
      
      const bomMaterials = materials.map(material => ({
        bom_id: bomData.id,
        item_id: material.itemId,
        quantity: material.quantity,
        unit_of_measure: material.unitOfMeasure
      }));
      
      const { error: materialsError } = await supabase.from('bom_materials').insert(bomMaterials);
      
      if (materialsError) throw materialsError;
      
      const materialObjects: Material[] = materials.map(material => ({
        id: material.id || bomData.id,
        itemId: material.itemId,
        name: inventoryItems.find(item => item.id === material.itemId)?.name || 'Unknown Item',
        quantity: material.quantity,
        unitOfMeasure: material.unitOfMeasure
      }));
      
      const newBOM: BOM = {
        id: bomData.id,
        productName,
        description,
        materials: materialObjects,
        finishedItemId,
        createdAt: new Date(bomData.created_at)
      };
      
      setBoms(prevBOMs => [newBOM, ...prevBOMs]);
      toast.success('Bill of Materials created successfully');
      return newBOM;
      
    } catch (error) {
      console.error('Error creating BOM:', error);
      toast.error('Failed to create Bill of Materials');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [inventoryItems]);

  const updateBOM = useCallback(async (
    id: string,
    productName: string,
    description: string,
    materials: Omit<Material, 'name'>[],
    finishedItemId?: string
  ) => {
    try {
      setIsLoading(true);
      
      const { error: bomError } = await supabase.from('boms').update({
        product_name: productName,
        description: description,
        finished_item_id: finishedItemId
      }).eq('id', id);

      if (bomError) throw bomError;
      
      const { error: deleteError } = await supabase.from('bom_materials').delete().eq('bom_id', id);
      
      if (deleteError) throw deleteError;
      
      const bomMaterials = materials.map(material => ({
        bom_id: id,
        item_id: material.itemId,
        quantity: material.quantity,
        unit_of_measure: material.unitOfMeasure
      }));
      
      const { error: materialsError } = await supabase.from('bom_materials').insert(bomMaterials);
      
      if (materialsError) throw materialsError;
      
      const materialObjects: Material[] = materials.map(material => ({
        id: material.id || id,
        itemId: material.itemId,
        name: inventoryItems.find(item => item.id === material.itemId)?.name || 'Unknown Item',
        quantity: material.quantity,
        unitOfMeasure: material.unitOfMeasure
      }));
      
      setBoms(prevBOMs => 
        prevBOMs.map(bom => 
          bom.id === id 
            ? { 
                ...bom, 
                productName, 
                description, 
                materials: materialObjects,
                finishedItemId, 
                updatedAt: new Date() 
              } 
            : bom
        )
      );
      
      toast.success('Bill of Materials updated successfully');
      return true;
      
    } catch (error) {
      console.error('Error updating BOM:', error);
      toast.error('Failed to update Bill of Materials');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [inventoryItems]);

  const deleteBOM = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      
      const { data: productionOrdersData, error: checkError } = await supabase
        .from('production_orders')
        .select('id')
        .eq('bom_id', id);
      
      if (checkError) throw checkError;
      
      if (productionOrdersData && productionOrdersData.length > 0) {
        toast.warning(`This BOM is used in ${productionOrdersData.length} production order(s). Deleting it may affect production data.`);
      }
      
      const { error: materialsError } = await supabase
        .from('bom_materials')
        .delete()
        .eq('bom_id', id);
      
      if (materialsError) throw materialsError;
      
      const { error: bomError } = await supabase
        .from('boms')
        .delete()
        .eq('id', id);
      
      if (bomError) throw bomError;
      
      setBoms(prevBOMs => prevBOMs.filter(bom => bom.id !== id));
      
      toast.success('Bill of Materials deleted successfully');
      return true;
      
    } catch (error) {
      console.error('Error deleting BOM:', error);
      toast.error('Failed to delete Bill of Materials');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProductionOrder = useCallback(async (
    bomId: string,
    quantityToProduce: number,
    startDate: Date
  ) => {
    try {
      setIsLoading(true);
      
      const bom = boms.find(b => b.id === bomId);
      if (!bom) {
        throw new Error('Bill of Materials not found');
      }
      
      const laborCost = 0;
      const additionalCosts = 0;
      
      const batchId = `BATCH-${new Date().getTime().toString().slice(-6)}`;
      
      const { data, error } = await supabase.from('production_orders').insert({
        bom_id: bomId,
        quantity_to_produce: quantityToProduce,
        status: 'planned',
        start_date: startDate.toISOString(),
        labor_cost: laborCost,
        additional_costs: additionalCosts,
        batch_id: batchId
      }).select().single();

      if (error) throw error;
      
      const newProductionOrder: ProductionOrder = {
        id: data.id,
        bomId,
        bom,
        quantityToProduce,
        status: 'planned',
        startDate,
        laborCost,
        additionalCosts,
        totalCost: laborCost + additionalCosts,
        batchId,
        createdAt: new Date(data.created_at),
        orderNumber: `PO-${new Date().getFullYear()}-${data.id.substring(0, 4)}`
      };
      
      setProductionOrders(prevOrders => [newProductionOrder, ...prevOrders]);
      toast.success('Production order created successfully');
      return newProductionOrder;
      
    } catch (error) {
      console.error('Error creating production order:', error);
      toast.error('Failed to create production order');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [boms]);

  const updateProductionOrderStatus = useCallback(async (
    id: string,
    status: ProductionStatus,
    completionDate?: Date
  ) => {
    try {
      setIsLoading(true);
      
      const updateData: any = {
        status
      };
      
      if (completionDate) {
        updateData.completion_date = completionDate.toISOString();
      }
      
      const { error } = await supabase.from('production_orders')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      
      setProductionOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === id 
            ? { 
                ...order, 
                status,
                completionDate 
              } 
            : order
        )
      );
      
      toast.success(`Production order status updated to ${status}`);
      return true;
      
    } catch (error) {
      console.error('Error updating production order status:', error);
      toast.error('Failed to update production order status');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const completeProductionOrder = useCallback(async (
    id: string,
    laborCost: number,
    additionalCosts: number
  ) => {
    try {
      setIsLoading(true);
      
      const productionOrder = productionOrders.find(order => order.id === id);
      if (!productionOrder) {
        throw new Error('Production order not found');
      }
      
      const bom = boms.find(b => b.id === productionOrder.bomId);
      if (!bom) {
        throw new Error('Bill of Materials not found');
      }
      
      if (bom.finishedItemId) {
        await updateItemStock(
          bom.finishedItemId,
          (inventoryItems.find(item => item.id === bom.finishedItemId)?.currentStock || 0) + productionOrder.quantityToProduce
        );
      }
      
      const totalCost = laborCost + additionalCosts;
      
      const completionDate = new Date();
      const { error } = await supabase.from('production_orders').update({
        status: 'completed',
        completion_date: completionDate.toISOString(),
        labor_cost: laborCost,
        additional_costs: additionalCosts
      }).eq('id', id);

      if (error) throw error;
      
      setProductionOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === id 
            ? { 
                ...order, 
                status: 'completed',
                completionDate,
                laborCost,
                additionalCosts,
                totalCost
              } 
            : order
        )
      );
      
      toast.success('Production order completed successfully');
      return true;
      
    } catch (error) {
      console.error('Error completing production order:', error);
      toast.error('Failed to complete production order');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [boms, inventoryItems, productionOrders, updateItemStock]);

  const getBOMById = useCallback((id: string) => {
    return boms.find(bom => bom.id === id);
  }, [boms]);

  const getProductionOrderById = useCallback((id: string) => {
    return productionOrders.find(order => order.id === id);
  }, [productionOrders]);

  return {
    boms,
    productionOrders,
    isLoading,
    fetchBOMs,
    fetchProductionOrders,
    addBOM,
    updateBOM,
    deleteBOM,
    createProductionOrder,
    updateProductionOrderStatus,
    completeProductionOrder,
    getBOMById,
    getProductionOrderById
  };
}
