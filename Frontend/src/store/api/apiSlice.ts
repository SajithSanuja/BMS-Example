import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';
import { API_CONFIG } from '@/config/api';
import { supabase } from '@/integrations/supabase/client';

const baseQuery = fetchBaseQuery({
  baseUrl: API_CONFIG.API_BASE_URL,
  prepareHeaders: async (headers, { getState }) => {
    // Get token from Redux state first (fallback)
    const token = (getState() as RootState).auth.token;
    
    // Get fresh token from Supabase session (preferred)
    const { data: { session } } = await supabase.auth.getSession();
    const supabaseToken = session?.access_token;
    
    // Use Supabase token if available, otherwise fall back to Redux token
    const authToken = supabaseToken || token;
    
    if (authToken) {
      headers.set('authorization', `Bearer ${authToken}`);
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
