import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';
import { API_CONFIG } from '@/config/api';

const baseQuery = fetchBaseQuery({
  baseUrl: API_CONFIG.API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    // Set default headers from config
    Object.entries(API_CONFIG.CORS.headers).forEach(([key, value]) => {
      headers.set(key, value);
    });
    return headers;
  },
  // Add CORS configuration from centralized config
  fetchFn: async (input, init) => {
    return fetch(input, {
      ...init,
      mode: API_CONFIG.CORS.mode,
      credentials: API_CONFIG.CORS.credentials,
    });
  },
});

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['User', 'Auth', 'Inventory'],
  endpoints: () => ({}),
});

export default apiSlice;
