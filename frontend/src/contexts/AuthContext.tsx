import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '../types';
import supabase from '../services/supabaseClient';

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, firstName: string, lastName: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
      if (session) {
        // If we have a session, fetch the user profile data
        fetchUserProfile(session.user.id);
      } else {
        setAuthState({
          user: null,
          loading: false,
          error: null,
        });
      }
    });

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      // @ts-ignore - Supabase auth event types
      async (event, session) => {
        if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          fetchUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            loading: false,
            error: null,
          });
        }
      }
    );

    // Cleanup on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Helper function to fetch user profile data
  const fetchUserProfile = async (userId: string) => {
    try {
      // First try to get the user profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // If there's an error fetching the profile
      if (error) {
        console.log('Error fetching profile, attempting to create one:', error);
        
        // Get the auth user data to create a profile
        const { data: userData } = await supabase.auth.getUser();
        if (!userData || !userData.user) {
          throw new Error('User authentication data not available');
        }
        
        // Get metadata to use for profile creation
        const metadata = userData.user.user_metadata || {};
        
        // Try to create a profile
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: userData.user.email || '',
            first_name: metadata.first_name || '',
            last_name: metadata.last_name || '',
            phone_number: metadata.phone_number || '',
            role: metadata.role || 'customer'
          })
          .select()
          .single();
          
        if (createError) {
          console.error('Failed to create profile:', createError);
          throw createError;
        }
        
        setAuthState({
          user: newProfile,
          loading: false,
          error: null,
        });
        return;
      }

      // Profile was fetched successfully
      setAuthState({
        user: profile,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Error handling user profile:', error);
      setAuthState({
        user: null,
        loading: false,
        error: error.message || 'Failed to fetch user profile',
      });
    }
  };

  const signIn = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log('Signing in user:', email);
      
      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      console.log('Sign in successful, fetching profile...');
      
      // Profile will be fetched by the auth state change listener
      // but we'll also manually call it for immediate effect
      if (data.user) {
        await fetchUserProfile(data.user.id);
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Sign in error:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'An unexpected error occurred',
      }));
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string, phone?: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Sign up the user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone_number: phone || '',
            role: 'customer'
          }
        }
      });
      
      if (error) throw error;
      
      // Manually create a profile entry and ensure it completes
      if (data.user) {
        console.log('Creating profile for user:', data.user.id);
        
        // Create profile with proper error handling
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email,
            first_name: firstName,
            last_name: lastName,
            phone_number: phone || '',
            role: 'customer'
          });
        
        if (profileError) {
          console.error('Error creating profile during signup:', profileError);
          
          // Try to determine if this is a duplicate key error
          if (profileError.message?.includes('duplicate key') || profileError.code === '23505') {
            console.log('Profile may already exist, continuing...');
          } else {
            // For other errors, throw to be caught by the outer catch
            throw profileError;
          }
        } else {
          console.log('Profile created successfully');
        }
      }
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: null,
      }));
      return { success: true };
    } catch (error: any) {
      console.error('Signup error:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'An unexpected error occurred',
      }));
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      // Auth state change listener will update the state
      return { success: true };
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'An unexpected error occurred',
      }));
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  };

  const updateUserProfile = async (profileData: Partial<User>) => {
    if (!authState.user) {
      return { success: false, error: 'User not authenticated' };
    }

    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', authState.user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      setAuthState({
        user: data,
        loading: false,
        error: null,
      });
      return { success: true };
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'An unexpected error occurred',
      }));
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        signIn,
        signUp,
        signOut,
        updateUserProfile,
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
