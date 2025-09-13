import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  useEffect(() => {
    // Get session on initial load
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setState(prev => ({ ...prev, loading: false }));
          return;
        }

        if (session) {
          // Get user data
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError || !user) {
            console.error('Error getting user data:', userError);
            setState(prev => ({ ...prev, loading: false }));
            return;
          }

          // Fetch user profile
          const profile = await fetchUserProfile(user.id);
          
          setState({
            user: user as AuthUser,
            profile,
            session,
            loading: false,
            error: null,
          });
        } else {
          setState(prev => ({ ...prev, loading: false }));
        }
      } catch (err) {
        console.error('Unexpected error getting session:', err);
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      console.log('Auth state changed:', event);
      
      if (session) {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error('Error getting user data:', userError);
          setState(prev => ({ ...prev, session, loading: false }));
          return;
        }

        // Fetch user profile
        const profile = await fetchUserProfile(user.id);
        
        setState({
          user: user as AuthUser,
          profile,
          session,
          loading: false,
          error: null,
        });
      } else {
        setState({
          user: null,
          profile: null,
          session: null,
          loading: false,
          error: null,
        });
      }
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Helper function to fetch user profile data
  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      if (!data) {
        console.log('No profile found, creating one');
        // Get user data
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
          console.error('Error getting user data:', userError);
          return null;
        }

        // ... existing code ...
      }

      return data;
    } catch (err) {
      console.error('Error in fetchUserProfile:', err);
      return null;
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
