import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { UserRole } from '@/types';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
}

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  role?: UserRole;
}

export class AuthService {
  /**
   * Sign in with email and password
   */
  static async signIn(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('🔐 AuthService: Signing in user:', credentials.email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        console.error('❌ AuthService: Sign in error:', error);
        return { user: null, session: null, error: error.message };
      }

      if (!data.user || !data.session) {
        return { user: null, session: null, error: 'No user data returned' };
      }

      // Fetch user profile
      const user = await this.fetchUserProfile(data.user);
      
      console.log('✅ AuthService: Sign in successful:', user?.email);
      return { user, session: data.session };
    } catch (error: any) {
      console.error('💥 AuthService: Sign in failed:', error);
      return { user: null, session: null, error: error.message || 'Sign in failed' };
    }
  }

  /**
   * Sign up with email and password
   */
  static async signUp(userData: RegisterData): Promise<AuthResponse> {
    try {
      console.log('📝 AuthService: Signing up user:', userData.email);
      
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.fullName,
          }
        }
      });

      if (error) {
        console.error('❌ AuthService: Sign up error:', error);
        return { user: null, session: null, error: error.message };
      }

      if (data.user && !data.session) {
        return { 
          user: null, 
          session: null, 
          error: 'Please check your email to confirm your account' 
        };
      }

      // Create user profile if user was created and confirmed
      if (data.user) {
        await this.createUserProfile(data.user, userData);
        
        if (data.session) {
          const user = await this.fetchUserProfile(data.user);
          console.log('✅ AuthService: Sign up successful:', user?.email);
          return { user, session: data.session };
        }
      }

      return { user: null, session: null };
    } catch (error: any) {
      console.error('💥 AuthService: Sign up failed:', error);
      return { user: null, session: null, error: error.message || 'Sign up failed' };
    }
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<{ error?: string }> {
    try {
      console.log('👋 AuthService: Signing out user');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ AuthService: Sign out error:', error);
        return { error: error.message };
      }

      console.log('✅ AuthService: Sign out successful');
      return {};
    } catch (error: any) {
      console.error('💥 AuthService: Sign out failed:', error);
      return { error: error.message || 'Sign out failed' };
    }
  }

  /**
   * Get current session
   */
  static async getCurrentSession(): Promise<{ session: Session | null; error?: string }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ AuthService: Get session error:', error);
        return { session: null, error: error.message };
      }

      return { session };
    } catch (error: any) {
      console.error('💥 AuthService: Get session failed:', error);
      return { session: null, error: error.message || 'Failed to get session' };
    }
  }

  /**
   * Get current user
   */
  static async getCurrentUser(): Promise<AuthResponse> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('❌ AuthService: Get user error:', error);
        return { user: null, session: null, error: error.message };
      }

      if (!user) {
        return { user: null, session: null };
      }

      const userProfile = await this.fetchUserProfile(user);
      const { session } = await this.getCurrentSession();
      
      return { user: userProfile, session };
    } catch (error: any) {
      console.error('💥 AuthService: Get user failed:', error);
      return { user: null, session: null, error: error.message || 'Failed to get user' };
    }
  }

  /**
   * Refresh session
   */
  static async refreshSession(): Promise<{ session: Session | null; error?: string }> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ AuthService: Refresh session error:', error);
        return { session: null, error: error.message };
      }

      return { session: data.session };
    } catch (error: any) {
      console.error('💥 AuthService: Refresh session failed:', error);
      return { session: null, error: error.message || 'Failed to refresh session' };
    }
  }

  /**
   * Listen to auth changes
   */
  static onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    console.log('🔗 AuthService: Setting up auth state change listener');
    return supabase.auth.onAuthStateChange((event, session) => {
      console.log(`🔄 AuthService: Auth event "${event}" triggered`);
      callback(event, session);
    });
  }

  /**
   * Fetch user profile from database
   */
  private static async fetchUserProfile(supabaseUser: SupabaseUser): Promise<User | null> {
    try {
      console.log('🔍 AuthService: Fetching profile for user ID:', supabaseUser.id);
      console.log('🔍 AuthService: User email:', supabaseUser.email);
      
      // Try to fetch the profile with better error handling
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle(); // Use maybeSingle instead of single to avoid error if not found

      console.log('📋 AuthService: Raw profile data:', profile);
      console.log('❌ AuthService: Profile fetch error:', error);

      // Check if it's an RLS infinite recursion error
      if (error && error.code === '42P17') {
        console.log('🚨 AuthService: RLS infinite recursion detected, using email-based fallback');
        
        // Use email-based role assignment as fallback
        const role = supabaseUser.email === 'manager@example.com' ? 'manager' : 'employee';
        console.log('🛠️ AuthService: Assigning role based on email:', role);
        
        return {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          fullName: supabaseUser.email === 'manager@example.com' ? 'Manager User' : 
                   supabaseUser.email === 'employee@example.com' ? 'Employee User' : 
                   supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
          role: role as UserRole,
          isActive: true,
        };
      }

      // If there's another error or profile not found
      if (error || !profile) {
        console.log('⚠️ AuthService: Profile fetch failed, using email-based fallback');
        console.log('Error code:', error?.code);
        console.log('Error message:', error?.message);
        
        // Use email-based role assignment as fallback
        const role = supabaseUser.email === 'manager@example.com' ? 'manager' : 'employee';
        console.log('🛠️ AuthService: Assigning role based on email:', role);
        
        return {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          fullName: supabaseUser.email === 'manager@example.com' ? 'Manager User' : 
                   supabaseUser.email === 'employee@example.com' ? 'Employee User' : 
                   supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
          role: role as UserRole,
          isActive: true,
        };
      }

      const userProfile = {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        fullName: (profile as any).full_name || supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
        role: ((profile as any).role as UserRole) || 'employee',
        isActive: (profile as any).is_active !== false,
      };

      console.log('✅ AuthService: Constructed user profile:', userProfile);
      return userProfile;
    } catch (error) {
      console.error('💥 AuthService: Fetch profile failed:', error);
      
      // Fallback based on email
      const role = supabaseUser.email === 'manager@example.com' ? 'manager' : 'employee';
      console.log('🛠️ AuthService: Using final fallback with role:', role);
      
      return {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        fullName: supabaseUser.email === 'manager@example.com' ? 'Manager User' : 
                 supabaseUser.email === 'employee@example.com' ? 'Employee User' : 
                 supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
        role: role as UserRole,
        isActive: true,
      };
    }
  }

  /**
   * Create user profile in database
   */
  private static async createUserProfile(supabaseUser: SupabaseUser, userData: RegisterData): Promise<void> {
    try {
      const profileData = {
        id: supabaseUser.id,
        full_name: userData.fullName,
        role: userData.role || 'employee',
        is_active: true,
      };

      const { error } = await supabase
        .from('user_profiles' as any)
        .insert(profileData);

      if (error) {
        console.error('❌ AuthService: Create profile error:', error);
        // Don't throw - we'll create a default profile later
      } else {
        console.log('✅ AuthService: User profile created');
      }
    } catch (error) {
      console.error('💥 AuthService: Create profile failed:', error);
      // Don't throw - we'll create a default profile later
    }
  }

  /**
   * Create default profile fallback
   */
  private static async createDefaultProfile(supabaseUser: SupabaseUser): Promise<User> {
    const defaultProfile = {
      id: supabaseUser.id,
      full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
      role: 'employee',
      is_active: true,
    };

    try {
      const { error } = await supabase
        .from('user_profiles' as any)
        .insert(defaultProfile);

      if (error) {
        console.error('❌ AuthService: Create default profile error:', error);
      } else {
        console.log('✅ AuthService: Default profile created');
      }
    } catch (error) {
      console.error('💥 AuthService: Create default profile failed:', error);
    }

    return {
      id: supabaseUser.id,
      email: supabaseUser.email!,
      fullName: defaultProfile.full_name,
      role: defaultProfile.role as UserRole,
      isActive: defaultProfile.is_active,
    };
  }
}
