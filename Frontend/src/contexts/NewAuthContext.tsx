import React, { createContext, useContext, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { setCredentials, logout as logoutAction, setLoading, setError } from '@/store/slices/authSlice';
import { useLoginMutation, useLogoutMutation, useGetCurrentUserQuery } from '@/store/api/authApi';
import { User, UserRole } from '@/types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  checkAccess: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();
  const authState = useSelector((state: RootState) => state.auth);
  
  const [loginMutation] = useLoginMutation();
  const [logoutMutation] = useLogoutMutation();
  
  // Query current user on app load if token exists
  const { data: currentUserData, error: currentUserError } = useGetCurrentUserQuery(undefined, {
    skip: !authState.token,
  });

  // Update user data when current user query succeeds
  useEffect(() => {
    if (currentUserData?.user) {
      const user: User = {
        id: currentUserData.user.id,
        email: currentUserData.user.email,
        fullName: currentUserData.user.fullName,
        role: currentUserData.user.role as UserRole,
        isActive: currentUserData.user.isActive
      };
      dispatch(setCredentials({ 
        user, 
        token: authState.token!, 
        refreshToken: authState.refreshToken! 
      }));
    }
  }, [currentUserData, dispatch, authState.token, authState.refreshToken]);

  // Handle current user query error
  useEffect(() => {
    if (currentUserError) {
      dispatch(logoutAction());
    }
  }, [currentUserError, dispatch]);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      
      const result = await loginMutation({ email, password }).unwrap();
      
      const user: User = {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        role: result.user.role as UserRole,
        isActive: true
      };

      dispatch(setCredentials({
        user,
        token: result.session.access_token,
        refreshToken: result.session.refresh_token
      }));

      toast.success('Login successful!');
    } catch (error: any) {
      const errorMessage = error?.data?.error || 'Login failed. Please try again.';
      dispatch(setError(errorMessage));
      toast.error(errorMessage);
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Register function (placeholder for now)
  const register = async (userData: any) => {
    try {
      dispatch(setLoading(true));
      // TODO: Implement registration with backend
      toast.success('Registration successful!');
    } catch (error: any) {
      const errorMessage = error?.data?.error || 'Registration failed. Please try again.';
      dispatch(setError(errorMessage));
      toast.error(errorMessage);
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch (error) {
      // Continue with logout even if backend call fails
      console.error('Logout error:', error);
    } finally {
      dispatch(logoutAction());
      toast.success('Logged out successfully');
    }
  };

  // Update user data (placeholder)
  const updateUser = (userData: Partial<User>) => {
    if (!authState.user) return;
    // TODO: Implement user update with backend
    console.log('Update user:', userData);
  };

  // Check if user has access based on roles
  const checkAccess = (roles: UserRole[]): boolean => {
    if (!authState.user) return false;
    return roles.includes(authState.user.role);
  };

  const contextValue: AuthContextType = {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    error: authState.error,
    login,
    register,
    logout,
    updateUser,
    checkAccess
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
