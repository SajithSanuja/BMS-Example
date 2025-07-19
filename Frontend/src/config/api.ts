// ================================================
// CENTRALIZED API CONFIGURATION
// ================================================
// This file contains all backend URL and API settings
// Change the backend URL here and it will apply everywhere

// Environment-based configuration
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Backend URL Configuration
export const API_CONFIG = {
  // Main backend URL - CHANGE THIS WHEN BACKEND URL CHANGES
  BASE_URL: isDevelopment 
    ? 'http://localhost:5000'  // Development backend
    : 'https://your-production-backend.com',  // Production backend
  
  // API endpoints
  API_PREFIX: '/api',
  
  // Full API base URL
  get API_BASE_URL() {
    return `${this.BASE_URL}${this.API_PREFIX}`;
  },
  
  // Individual endpoint URLs
  ENDPOINTS: {
    // Authentication
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout',
      ME: '/auth/me',
      REFRESH: '/auth/refresh',
    },
    
    // Inventory
    INVENTORY: {
      LIST: '/inventory',
      CREATE: '/inventory',
      GET: (id: string) => `/inventory/${id}`,
      UPDATE: (id: string) => `/inventory/${id}`,
      DELETE: (id: string) => `/inventory/${id}`,
      UPDATE_STOCK: (id: string) => `/inventory/${id}/stock`,
    },
    
    // Sales
    SALES: {
      LIST: '/sales',
      CREATE: '/sales',
      GET: (id: string) => `/sales/${id}`,
      UPDATE: (id: string) => `/sales/${id}`,
      DELETE: (id: string) => `/sales/${id}`,
    },
    
    // Manufacturing
    MANUFACTURING: {
      LIST: '/manufacturing',
      CREATE: '/manufacturing',
      GET: (id: string) => `/manufacturing/${id}`,
      UPDATE: (id: string) => `/manufacturing/${id}`,
      DELETE: (id: string) => `/manufacturing/${id}`,
    },
    
    // Financial
    FINANCIAL: {
      TRANSACTIONS: '/financial/transactions',
      REPORTS: '/financial/reports',
      BUDGET: '/financial/budget',
    },
    
    // Users
    USERS: {
      LIST: '/users',
      CREATE: '/users',
      GET: (id: string) => `/users/${id}`,
      UPDATE: (id: string) => `/users/${id}`,
      DELETE: (id: string) => `/users/${id}`,
    },
    
    // Suppliers
    SUPPLIERS: {
      LIST: '/suppliers',
      CREATE: '/suppliers',
      GET: (id: string) => `/suppliers/${id}`,
      UPDATE: (id: string) => `/suppliers/${id}`,
      DELETE: (id: string) => `/suppliers/${id}`,
    },
    
    // Customers
    CUSTOMERS: {
      LIST: '/customers',
      CREATE: '/customers',
      GET: (id: string) => `/customers/${id}`,
      UPDATE: (id: string) => `/customers/${id}`,
      DELETE: (id: string) => `/customers/${id}`,
    },
    
    // Health check
    HEALTH: '/health',
  },
  
  // Request configuration
  REQUEST_CONFIG: {
    timeout: 30000, // 30 seconds
    retries: 3,
    retryDelay: 1000, // 1 second
  },
  
  // CORS configuration
  CORS: {
    credentials: 'include' as RequestCredentials,
    mode: 'cors' as RequestMode,
    headers: {
      'Content-Type': 'application/json',
    },
  },
};

// Helper functions for building URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.API_BASE_URL}${endpoint}`;
};

export const buildFullUrl = (path: string): string => {
  return `${API_CONFIG.BASE_URL}${path}`;
};

// Environment info
export const ENV_INFO = {
  isDevelopment,
  isProduction,
  backendUrl: API_CONFIG.BASE_URL,
  apiBaseUrl: API_CONFIG.API_BASE_URL,
};

// Export default configuration
export default API_CONFIG;
