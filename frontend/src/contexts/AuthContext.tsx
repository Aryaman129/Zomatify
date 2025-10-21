import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { AuthState, AuthContextType, AuthUser, User } from '../types/index';
import { supabase } from '../services/supabaseClient';

// Create the AuthContext
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    error: null,
  });

  // Add refs to prevent race conditions
  const initializingRef = useRef(false);
  const fetchingProfileRef = useRef<string | null>(null); // Store userId being fetched
  const authHandlerDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Get session on initial load
    const getSession = async () => {
      if (initializingRef.current) {
        console.log('🔒 Already initializing, skipping...');
        return;
      }
      initializingRef.current = true;
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          if (mountedRef.current) {
            setState(prev => ({ ...prev, loading: false }));
          }
          initializingRef.current = false;
          return;
        }

        if (session?.user) {
          console.log('✅ Initial session found, loading user data...');
          const profile = await fetchUserProfile(session.user.id);
          
          if (mountedRef.current) {
            setState({
              user: session.user as AuthUser,
              profile,
              session,
              loading: false,
              error: null,
            });
          }
        } else {
          console.log('ℹ️ No initial session');
          if (mountedRef.current) {
            setState(prev => ({ ...prev, loading: false }));
          }
        }
      } catch (err) {
        console.error('💥 Unexpected error getting session:', err);
        if (mountedRef.current) {
          setState(prev => ({ ...prev, loading: false }));
        }
      } finally {
        initializingRef.current = false;
      }
    };

    getSession();

    // Listen for auth changes with debouncing
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      console.log('🔄 Auth state changed:', event);
      
      // Skip INITIAL_SESSION to prevent duplicate processing
      if (event === 'INITIAL_SESSION') {
        console.log('⏸️ Skipping INITIAL_SESSION (handled by getSession)');
        return;
      }
      
      // Debounce rapid auth state changes
      if (authHandlerDebounceRef.current) {
        clearTimeout(authHandlerDebounceRef.current);
      }
      
      authHandlerDebounceRef.current = setTimeout(async () => {
        if (!mountedRef.current) return;
        
        if (session?.user) {
          console.log('👤 Session exists, fetching profile...');
          const profile = await fetchUserProfile(session.user.id);
          
          if (mountedRef.current) {
            setState({
              user: session.user as AuthUser,
              profile,
              session,
              loading: false,
              error: null,
            });
          }
        } else {
          console.log('👋 Session ended, clearing state');
          if (mountedRef.current) {
            setState({
              user: null,
              profile: null,
              session: null,
              loading: false,
              error: null,
            });
          }
        }
      }, 300); // 300ms debounce
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
      if (authHandlerDebounceRef.current) {
        clearTimeout(authHandlerDebounceRef.current);
      }
    };
  }, []);

  // Helper function to fetch user profile data
  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    // Prevent concurrent profile fetches for the same user
    if (fetchingProfileRef.current === userId) {
      console.log('🔒 Profile fetch already in progress for user:', userId);
      return null;
    }
    
    fetchingProfileRef.current = userId;
    
    try {
      console.log('🔍 Fetching profile for user:', userId);
      
      // Single timeout for profile fetch - 5 seconds
      const profileQuery = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const timeoutPromise = new Promise<{ data: null; error: { message: string; code?: string } }>((resolve) =>
        setTimeout(() => {
          console.log('⏰ Profile query timeout (5s)');
          resolve({ data: null, error: { message: 'Timeout', code: 'TIMEOUT' } });
        }, 5000)
      );

      const result = await Promise.race([profileQuery, timeoutPromise]);
      const { data, error } = result;

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found, create one
          console.log('📝 Creating profile for new user');
          
          const { data: userData } = await supabase.auth.getUser();
          if (!userData?.user) return null;

          const userMeta = userData.user.user_metadata || {};
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: userData.user.email || '',
              first_name: userMeta.first_name || userMeta.full_name?.split(' ')[0] || '',
              last_name: userMeta.last_name || userMeta.full_name?.split(' ').slice(1).join(' ') || '',
              phone_number: userMeta.phone_number || '',
              role: userMeta.role || 'customer'
            })
            .select()
            .single();

          console.log('✅ Profile created');
          return newProfile;
        } else if (error.code === 'TIMEOUT') {
          console.log('⏰ Profile fetch timed out, returning null');
          return null;
        }
        
        console.error('❌ Profile fetch error:', error);
        return null;
      }

      console.log('✅ Profile loaded');
      return data;
    } catch (err) {
      console.error('💥 Profile fetch error:', err);
      return null;
    } finally {
      fetchingProfileRef.current = null;
    }
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Error signing in:', error.message);
        setState(prev => ({
          ...prev,
          loading: false,
          error: error.message,
        }));
        return { success: false, error: error.message || 'Failed to sign in' };
      }

      if (data?.user) {
        const profile = await fetchUserProfile(data.user.id);
        setState(prev => ({
          ...prev,
          user: data.user as AuthUser,
          profile,
          session: data.session,
          loading: false,
          error: null,
        }));
        return { success: true };
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: 'No user data returned',
      }));
      return { success: false, error: 'No user data returned' };
    } catch (error: any) {
      console.error('Unexpected error during sign in:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'An unexpected error occurred',
      }));
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone?: string,
    role: 'customer' | 'shopkeeper' | 'admin' = 'customer'
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Create user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone_number: phone || '',
            role: role
          }
        }
      });

      if (error) {
        console.error('Error during signup:', error);
        return { success: false, error: error.message };
      }

      if (!data || !data.user) {
        return { success: false, error: 'Failed to create user' };
      }

      // Profile row will be created by database trigger (handle_new_user)
      return { success: true };
    } catch (err: any) {
      console.error('Unexpected error during signup:', err);
      return { success: false, error: err.message || 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error.message,
        }));
        return { success: false, error: error.message };
      }
      
      // Auth state change listener will update the state
      return { success: true };
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'An unexpected error occurred',
      }));
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  };

  const updateUserProfile = async (profileData: Partial<User>) => {
    if (!state.user) {
      return { success: false, error: 'User not authenticated' };
    }

    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', state.user.id)
        .select()
        .single();
      
      if (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error.message,
        }));
        return { success: false, error: error.message };
      }
      
      setState(prev => ({
        ...prev,
        profile: data,
        loading: false,
      }));
      
      return { success: true };
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
      
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signUp,
        signOut,
        updateUserProfile,
        error: state.error || null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
