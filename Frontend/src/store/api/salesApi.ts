import { apiSlice } from './apiSlice';
import { API_CONFIG } from '@/config/api';

// Placeholder sales API - to be implemented
export const salesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Placeholder endpoints - to be implemented when sales functionality is added
    // getSalesOrders: builder.query<any, void>({
    //   query: () => API_CONFIG.ENDPOINTS.SALES.LIST,
    //   providesTags: ['Sales'],
    // }),
  }),
});

export const {
  // Export hooks here when endpoints are implemented
} = salesApi;
