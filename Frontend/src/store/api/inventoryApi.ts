import { apiSlice } from './apiSlice';
import { InventoryItem } from '@/types';
import { API_CONFIG } from '@/config/api';

interface BackendInventoryItem {
  id: string;
  name: string;
  description: string;
  category: string;
  unit_of_measure: string;
  purchase_cost: number;
  selling_price: number;
  current_stock: number;
  reorder_level: number;
  sku: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateInventoryItem {
  name: string;
  description?: string;
  category: string;
  unit_of_measure: string;
  purchase_cost?: number;
  selling_price?: number;
  current_stock?: number;
  reorder_level?: number;
  sku: string;
}

interface UpdateStockRequest {
  quantity: number;
  operation?: 'set' | 'add' | 'subtract';
}

interface BackendInventoryResponse {
  data: BackendInventoryItem[];
}

interface BackendSingleInventoryResponse {
  data: BackendInventoryItem;
}

interface InventoryResponse {
  data: InventoryItem[];
}

interface SingleInventoryResponse {
  data: InventoryItem;
}

// Transform backend snake_case to frontend camelCase
const transformInventoryItem = (backendItem: BackendInventoryItem): InventoryItem => ({
  id: backendItem.id,
  name: backendItem.name,
  description: backendItem.description,
  category: backendItem.category,
  unitOfMeasure: backendItem.unit_of_measure as any,
  purchaseCost: backendItem.purchase_cost,
  sellingPrice: backendItem.selling_price,
  currentStock: backendItem.current_stock,
  reorderLevel: backendItem.reorder_level,
  isActive: backendItem.is_active,
  sku: backendItem.sku,
  createdAt: new Date(backendItem.created_at),
  updatedAt: new Date(backendItem.updated_at),
});

// Transform frontend camelCase to backend snake_case for updates
const transformInventoryItemForUpdate = (frontendItem: Partial<InventoryItem>): any => {
  const transformed: any = {};
  
  if (frontendItem.name !== undefined) transformed.name = frontendItem.name;
  if (frontendItem.description !== undefined) transformed.description = frontendItem.description;
  if (frontendItem.category !== undefined) transformed.category = frontendItem.category;
  if (frontendItem.unitOfMeasure !== undefined) transformed.unit_of_measure = frontendItem.unitOfMeasure;
  if (frontendItem.purchaseCost !== undefined) transformed.purchase_cost = frontendItem.purchaseCost;
  if (frontendItem.sellingPrice !== undefined) transformed.selling_price = frontendItem.sellingPrice;
  if (frontendItem.currentStock !== undefined) transformed.current_stock = frontendItem.currentStock;
  if (frontendItem.reorderLevel !== undefined) transformed.reorder_level = frontendItem.reorderLevel;
  if (frontendItem.isActive !== undefined) transformed.is_active = frontendItem.isActive;
  if (frontendItem.sku !== undefined) transformed.sku = frontendItem.sku;
  
  return transformed;
};

export const inventoryApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInventoryItems: builder.query<InventoryResponse, void>({
      query: () => API_CONFIG.ENDPOINTS.INVENTORY.LIST,
      providesTags: ['Inventory'],
      transformResponse: (response: BackendInventoryResponse): InventoryResponse => ({
        data: response.data.map(transformInventoryItem)
      }),
    }),
    
    getInventoryItem: builder.query<SingleInventoryResponse, string>({
      query: (id) => API_CONFIG.ENDPOINTS.INVENTORY.GET(id),
      providesTags: (result, error, id) => [{ type: 'Inventory', id }],
      transformResponse: (response: BackendSingleInventoryResponse): SingleInventoryResponse => ({
        data: transformInventoryItem(response.data)
      }),
    }),
    
    createInventoryItem: builder.mutation<SingleInventoryResponse, CreateInventoryItem>({
      query: (newItem) => ({
        url: API_CONFIG.ENDPOINTS.INVENTORY.CREATE,
        method: 'POST',
        body: newItem,
      }),
      invalidatesTags: ['Inventory'],
      transformResponse: (response: BackendSingleInventoryResponse): SingleInventoryResponse => ({
        data: transformInventoryItem(response.data)
      }),
    }),
    
    updateInventoryItem: builder.mutation<SingleInventoryResponse, { id: string; updates: Partial<InventoryItem> }>({
      query: ({ id, updates }) => ({
        url: API_CONFIG.ENDPOINTS.INVENTORY.UPDATE(id),
        method: 'PUT',
        body: transformInventoryItemForUpdate(updates),
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Inventory', id }, 'Inventory'],
      transformResponse: (response: BackendSingleInventoryResponse): SingleInventoryResponse => ({
        data: transformInventoryItem(response.data)
      }),
    }),
    
    deleteInventoryItem: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: API_CONFIG.ENDPOINTS.INVENTORY.DELETE(id),
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Inventory', id }, 'Inventory'],
    }),
  }),
});

export const {
  useGetInventoryItemsQuery,
  useGetInventoryItemQuery,
  useCreateInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation,
} = inventoryApi;
