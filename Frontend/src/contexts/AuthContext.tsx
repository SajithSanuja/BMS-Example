import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { setCredentials, logout, setLoading, setError } from '@/store/slices/authSlice';
import { AuthService, User, LoginCredentials, RegisterData } from '@/lib/authService';
import { SessionManager } from '@/lib/sessionManager';
import { UserRole } from '@/types';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
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
  const [session, setSession] = useState<Session | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing Supabase authentication...');
        dispatch(setLoading(true));
        dispatch(setError(null));

        // Get current session
        const { session: currentSession, error: sessionError } = await AuthService.getCurrentSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          SessionManager.clear();
          dispatch(logout());
          return;
        }

        console.log('📋 Session check result:', {
          hasSession: !!currentSession,
          userId: currentSession?.user?.id,
          email: currentSession?.user?.email,
          hasMetadata: SessionManager.hasMetadata(),
        });

        setSession(currentSession);

        if (currentSession) {
          // Check if session is expired (12 hours)
          if (SessionManager.hasMetadata() && SessionManager.isExpired()) {
            console.log('⏰ Session expired, signing out...');
            SessionManager.clear();
            await AuthService.signOut();
            dispatch(logout());
            return;
          }

          // Get current user
          const { user: currentUser, error: userError } = await AuthService.getCurrentUser();
          
          if (userError || !currentUser) {
            console.error('❌ User error:', userError);
            SessionManager.clear();
            await AuthService.signOut();
            dispatch(logout());
            return;
          }

          console.log('✅ User restored from session:', currentUser.email);
          dispatch(setCredentials({
            user: currentUser,
            token: currentSession.access_token,
            refreshToken: currentSession.refresh_token || '',
          }));

          // Store session metadata for 12-hour expiration
          SessionManager.store(currentSession);
        } else {
          console.log('❌ No active session found');
          SessionManager.clear();
          dispatch(logout());
        }
      } catch (err: any) {
        console.error('💥 Auth initialization error:', err);
        SessionManager.clear();
        dispatch(logout());
        dispatch(setError('Authentication initialization failed'));
      } finally {
        console.log('🏁 Auth initialization complete');
        setIsInitialized(true);
        dispatch(setLoading(false));
      }
    };

    initializeAuth();
  }, [dispatch]);

  // Safety mechanism: Ensure loading is false after initialization
  useEffect(() => {
    if (isInitialized && isLoading) {
      // Add a small delay to ensure all async operations complete
      const timer = setTimeout(() => {
        console.log('⚠️ Safety: Clearing loading state after initialization');
        dispatch(setLoading(false));
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isInitialized, isLoading, dispatch]);

  // Listen for Supabase auth state changes
  useEffect(() => {
    const { data: { subscription } } = AuthService.onAuthStateChange(async (event, session) => {
      console.log('🔄 Supabase auth state change:', event, session?.user?.email);
      
      // Skip processing during initialization to prevent race conditions
      if (!isInitialized && event === 'SIGNED_IN') {
        console.log('⚠️ Skipping SIGNED_IN event during initialization');
        return;
      }
      
      try {
        setSession(session);

        if (event === 'SIGNED_IN' && session && isInitialized) {
          console.log('✅ User signed in via Supabase (post-initialization)');
          
          const { user: currentUser, error: userError } = await AuthService.getCurrentUser();
          
          if (userError || !currentUser) {
            console.error('❌ Failed to get user after sign in:', userError);
            dispatch(setError('Failed to load user profile'));
            dispatch(setLoading(false));
            return;
          }

          dispatch(setCredentials({
            user: currentUser,
            token: session.access_token,
            refreshToken: session.refresh_token || '',
          }));

          SessionManager.store(session);
          dispatch(setLoading(false));
          
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out via Supabase');
          SessionManager.clear();
          dispatch(logout());
          
        } else if (event === 'TOKEN_REFRESHED' && session) {
          console.log('🔄 Token refreshed via Supabase');
          
          // Update session metadata
          SessionManager.store(session);
          
          // Check if session should expire
          if (SessionManager.hasMetadata() && SessionManager.isExpired()) {
            console.log('⏰ Session expired after token refresh');
            SessionManager.clear();
            await AuthService.signOut();
            return;
          }

          // Update tokens in Redux
          if (user) {
            dispatch(setCredentials({
              user,
              token: session.access_token,
              refreshToken: session.refresh_token || '',
            }));
          }
          
        } else if (event === 'INITIAL_SESSION') {
          console.log('🔄 Initial session event via Supabase');
          // Don't do anything here, initialization handles this
          
        } else if (event === 'PASSWORD_RECOVERY') {
          console.log('🔑 Password recovery event via Supabase');
          // Handle password recovery if needed
        }
      } catch (error: any) {
        console.error('💥 Error in auth state change handler:', error);
        dispatch(setError('Authentication state change failed'));
        dispatch(setLoading(false));
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch, user, isInitialized]);

  // Periodic session expiration check
  useEffect(() => {
    if (!isAuthenticated || !session) return;

    const checkSessionExpiration = () => {
      if (SessionManager.hasMetadata() && SessionManager.isExpired()) {
        console.log('⏰ Session expired during periodic check');
        handleLogout();
      }
    };

    // Check every 5 minutes
    const intervalId = setInterval(checkSessionExpiration, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [isAuthenticated, session]);

  // Auth methods
  const login = async (email: string, password: string): Promise<void> => {
    try {
      console.log('🔐 Attempting login via AuthService:', email);
      dispatch(setLoading(true));
      dispatch(setError(null));

      const { user, session, error } = await AuthService.signIn({ email, password });

      if (error || !user || !session) {
        throw new Error(error || 'Login failed');
      }

      // The auth state change listener will handle setting the credentials
      console.log('✅ Login successful, waiting for auth state change...');
      
    } catch (err: any) {
      const errorMessage = err?.message || 'Login failed';
      console.error('💥 Login failed:', errorMessage);
      dispatch(setError(errorMessage));
      dispatch(setLoading(false));
      throw new Error(errorMessage);
    }
  };

  const register = async (userData: RegisterData): Promise<void> => {
    try {
      console.log('📝 Attempting registration via AuthService:', userData.email);
      dispatch(setLoading(true));
      dispatch(setError(null));

      const { user, session, error } = await AuthService.signUp(userData);

      if (error) {
        if (error.includes('check your email')) {
          dispatch(setError(error));
          return;
        }
        throw new Error(error);
      }

      if (!user && !session) {
        dispatch(setError('Registration successful! Please check your email to confirm your account.'));
        return;
      }

      // The auth state change listener will handle setting the credentials
      console.log('✅ Registration successful');
      
    } catch (err: any) {
      const errorMessage = err?.message || 'Registration failed';
      console.error('💥 Registration failed:', errorMessage);
      dispatch(setError(errorMessage));
      throw new Error(errorMessage);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      console.log('👋 Attempting logout via AuthService');
      SessionManager.clear();
      
      const { error } = await AuthService.signOut();
      
      if (error) {
        console.warn('Logout error:', error);
      }
      
      // The auth state change listener will handle clearing the state
      console.log('✅ Logout successful');
      
    } catch (err: any) {
      console.warn('Logout request failed, clearing local state:', err);
      SessionManager.clear();
      dispatch(logout());
    }
  };

  const updateUser = (userData: Partial<User>): void => {
    if (user) {
      dispatch(setCredentials({
        user: { ...user, ...userData },
        token: token || '',
        refreshToken: refreshToken || '',
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
    isLoading: !isInitialized || (isLoading && isInitialized), // Only show loading after initialization if actively loading
    error,
    session,
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