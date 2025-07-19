import React, { createContext, useContext, ReactNode } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { setCredentials, logout, setLoading, setError } from '@/store/slices/authSlice';
import { useLoginMutation, useRegisterMutation, useLogoutMutation } from '@/store/api/authApi';
import { UserRole } from '@/types';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  checkAccess: (allowedRoles?: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isLoading, error, token, refreshToken } = useSelector((state: RootState) => state.auth);
  
  const [loginMutation] = useLoginMutation();
  const [registerMutation] = useRegisterMutation();
  const [logoutMutation] = useLogoutMutation();

  const login = async (email: string, password: string): Promise<void> => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      
      const result = await loginMutation({ email, password }).unwrap();
      
      dispatch(setCredentials({
        user: {
          ...result.user,
          role: result.user.role as UserRole, // Type assertion for role
          isActive: true // Default to true for login response, will be updated by getCurrentUser if needed
        },
        token: result.session.access_token,
        refreshToken: result.session.refresh_token || ''
      }));
    } catch (err: any) {
      const errorMessage = err?.data?.message || err?.message || 'Login failed';
      dispatch(setError(errorMessage));
      throw new Error(errorMessage);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const register = async (userData: any): Promise<void> => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      
      const result = await registerMutation(userData).unwrap();
      
      dispatch(setCredentials({
        user: {
          ...result.user,
          role: result.user.role as UserRole, // Type assertion for role
          isActive: true // Default to true for registration response
        },
        token: result.session.access_token,
        refreshToken: result.session.refresh_token || ''
      }));
    } catch (err: any) {
      const errorMessage = err?.data?.message || err?.message || 'Registration failed';
      dispatch(setError(errorMessage));
      throw new Error(errorMessage);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await logoutMutation().unwrap();
    } catch (err) {
      // Even if logout fails on the server, we still clear local state
      console.warn('Logout request failed, but clearing local state:', err);
    } finally {
      dispatch(logout());
    }
  };

  const updateUser = (userData: Partial<User>): void => {
    if (user) {
      dispatch(setCredentials({
        user: { ...user, ...userData },
        token: token || '', // Keep existing token
        refreshToken: refreshToken || '' // Keep existing refreshToken
      }));
    }
  };

  const checkAccess = (allowedRoles?: UserRole[]): boolean => {
    if (!isAuthenticated || !user) return false;
    if (!allowedRoles || allowedRoles.length === 0) return true;
    return allowedRoles.includes(user.role);
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout: handleLogout,
    updateUser,
    checkAccess,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;