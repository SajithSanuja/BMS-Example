import { apiSlice } from './apiSlice';
import { API_CONFIG } from '@/config/api';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role?: 'employee' | 'manager' | 'admin';
}

interface AuthResponse {
  message: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

interface UserResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    isActive: boolean;
  };
}

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: API_CONFIG.ENDPOINTS.AUTH.LOGIN,
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth', 'User'],
    }),
    
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (userData) => ({
        url: API_CONFIG.ENDPOINTS.AUTH.REGISTER,
        method: 'POST',
        body: userData,
      }),
    }),
    
    getCurrentUser: builder.query<UserResponse, void>({
      query: () => API_CONFIG.ENDPOINTS.AUTH.ME,
      providesTags: ['User'],
    }),
    
    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: API_CONFIG.ENDPOINTS.AUTH.LOGOUT,
        method: 'POST',
      }),
      invalidatesTags: ['Auth', 'User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetCurrentUserQuery,
  useLogoutMutation,
} = authApi;
