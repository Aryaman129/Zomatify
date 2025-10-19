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

  // Add ref to prevent race conditions during initialization
  const initializingRef = useRef(false);
  const fetchingProfileRef = useRef(false);

  useEffect(() => {
    // Get session on initial load
    const getSession = async () => {
      if (initializingRef.current) return; // Prevent race condition
      initializingRef.current = true;
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setState(prev => ({ ...prev, loading: false }));
          initializingRef.current = false;
          return;
        }

        if (session) {
          // Get user data with timeout protection
          const getUserPromise = supabase.auth.getUser();
          const getUserTimeout = new Promise<{ data: { user: null }; error: any }>((resolve) =>
            setTimeout(() => {
              console.log('⏰ Initial getUser() timed out, using session user instead');
              resolve({ data: { user: null }, error: new Error('getUser timeout') });
            }, 3000)
          );

          const { data: { user }, error: userError } = await Promise.race([getUserPromise, getUserTimeout]);
          
          let finalUser = user;
          if (userError || !user) {
            console.log('🔄 Using session.user as fallback in initial load');
            finalUser = session.user;
          }
          
          if (!finalUser) {
            console.error('Error getting user data and no session fallback:', userError);
            setState(prev => ({ ...prev, loading: false }));
            initializingRef.current = false;
            return;
          }

          // Fetch user profile with timeout protection
          try {
            const profilePromise = fetchUserProfile(finalUser.id);
            const timeoutPromise = new Promise<null>((resolve) =>
              setTimeout(() => resolve(null), 8000) // 8 second total timeout
            );

            const profile = await Promise.race([profilePromise, timeoutPromise]);
            
            setState({
              user: finalUser as AuthUser,
              profile,
              session,
              loading: false,
              error: null,
            });
          } catch (err) {
            console.error('Initial profile fetch failed:', err);
            setState({
              user: finalUser as AuthUser,
              profile: null,
              session,
              loading: false,
              error: 'Failed to load profile',
            });
          }
        } else {
          setState(prev => ({ ...prev, loading: false }));
        }
      } catch (err) {
        console.error('Unexpected error getting session:', err);
        setState(prev => ({ ...prev, loading: false }));
      } finally {
        initializingRef.current = false;
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      console.log('🔄 Auth state changed:', event);
      
      // Skip if currently initializing to prevent race conditions
      if (initializingRef.current && event === 'INITIAL_SESSION') {
        console.log('⏸️ Skipping auth change during initialization');
        return;
      }
      
      if (session) {
        console.log('👤 Session exists, getting user data...');
        
        // Add timeout to supabase.auth.getUser() to prevent hanging
        const getUserPromise = supabase.auth.getUser();
        const getUserTimeout = new Promise<{ data: { user: null }; error: any }>((resolve) =>
          setTimeout(() => {
            console.log('⏰ getUser() timed out, using session user instead');
            resolve({ data: { user: null }, error: new Error('getUser timeout') });
          }, 3000)
        );

        const { data: { user }, error: userError } = await Promise.race([getUserPromise, getUserTimeout]);
        
        if (userError || !user) {
          // Fallback to session.user if getUser() fails/times out
          const fallbackUser = session.user;
          if (fallbackUser) {
            console.log('🔄 Using session.user as fallback');
            
            console.log('🎯 User data retrieved (via fallback), fetching profile...');
            // Fetch user profile with timeout protection
            try {
              const profilePromise = fetchUserProfile(fallbackUser.id);
              const timeoutPromise = new Promise<null>((resolve) => {
                console.log('⏰ Setting up 5-second timeout for profile fetch...');
                setTimeout(() => {
                  console.log('⏰ Auth handler timeout reached - resolving with null profile');
                  resolve(null);
                }, 5000); // 5 second total timeout
              });

              console.log('🏁 Racing profile fetch with timeout...');
              const profile = await Promise.race([profilePromise, timeoutPromise]);
              
              console.log('✅ Profile fetch completed, updating state:', { profile });
              setState({
                user: fallbackUser as AuthUser,
                profile,
                session,
                loading: false,
                error: null,
              });
            } catch (err) {
              console.error('💥 Profile fetch failed:', err);
              setState({
                user: fallbackUser as AuthUser,
                profile: null,
                session,
                loading: false,
                error: 'Failed to load profile',
              });
            }
            return;
          }
          
          console.error('❌ Error getting user data and no session fallback:', userError);
          setState(prev => ({ ...prev, session, loading: false }));
          return;
        }

        console.log('🎯 User data retrieved, fetching profile...');
        // Fetch user profile with timeout protection
        try {
          const profilePromise = fetchUserProfile(user.id);
          const timeoutPromise = new Promise<null>((resolve) => {
            console.log('⏰ Setting up 5-second timeout for profile fetch...');
            setTimeout(() => {
              console.log('⏰ Auth handler timeout reached - resolving with null profile');
              resolve(null);
            }, 5000); // 5 second total timeout
          });

          console.log('🏁 Racing profile fetch with timeout...');
          const profile = await Promise.race([profilePromise, timeoutPromise]);
          
          console.log('✅ Profile fetch completed, updating state:', { profile });
          setState({
            user: user as AuthUser,
            profile,
            session,
            loading: false,
            error: null,
          });
        } catch (err) {
          console.error('💥 Profile fetch failed:', err);
          setState({
            user: user as AuthUser,
            profile: null,
            session,
            loading: false,
            error: 'Failed to load profile',
          });
        }
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
    // Prevent concurrent profile fetches
    if (fetchingProfileRef.current) {
      console.log('🔒 Profile fetch already in progress, skipping...');
      return null;
    }
    
    fetchingProfileRef.current = true;
    
    try {
      console.log('🔍 Starting profile fetch for user:', userId);
      
      // Add timeout to prevent hanging
      const profileQuery = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Create a timeout promise that resolves to null instead of rejecting
      const timeoutPromise = new Promise<{ data: null; error: { message: string; code?: string } }>((resolve) =>
        setTimeout(() => {
          console.log('⏰ Profile fetch timed out after 10 seconds');
          resolve({ data: null, error: { message: 'Profile fetch timed out', code: 'TIMEOUT' } });
        }, 10000) // Increased timeout to 10 seconds to handle slow connections
      );

      console.log('🚀 Racing profile query with timeout...');
      const result = await Promise.race([profileQuery, timeoutPromise]);
      const { data, error } = result;

      if (error) {
        console.log('❌ Profile fetch error:', error);
        
        if (error.code === 'PGRST116') {
          // No profile found, create one
          console.log('📝 No profile found, creating new profile...');
          
          const { data: userData, error: userError } = await supabase.auth.getUser();

          if (userError || !userData.user) {
            console.error('❌ Error getting user data:', userError);
            return null;
          }

          // Create profile for the user
          const userMeta = userData.user.user_metadata || {};
          const profileData = {
            id: userId,
            email: userData.user.email || '',
            first_name: userMeta.first_name || userMeta.full_name?.split(' ')[0] || '',
            last_name: userMeta.last_name || userMeta.full_name?.split(' ').slice(1).join(' ') || '',
            phone_number: userMeta.phone_number || '',
            role: userMeta.role || 'customer'
          };

          console.log('🚀 Creating profile with data:', profileData);
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert(profileData)
            .select()
            .single();

          if (createError) {
            // If profile already exists (duplicate key error), try fetching again
            if (createError.code === '23505') {
              console.log('⚠️ Profile already exists, fetching it again...');
              const { data: existingProfile, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
              
              if (!fetchError && existingProfile) {
                console.log('✅ Successfully fetched existing profile:', existingProfile);
                return existingProfile;
              }
            }
            
            console.error('❌ Error creating user profile:', createError);
            return null;
          }

          console.log('✅ Profile created successfully:', newProfile);
          return newProfile;
        } else if (error.code === 'TIMEOUT' || error.message === 'Profile fetch timed out') {
          // Timeout occurred, retry once more with longer timeout
          console.log('🔄 Retrying profile fetch after timeout...');
          const { data: retryData, error: retryError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          
          if (!retryError && retryData) {
            console.log('✅ Profile fetched successfully on retry:', retryData);
            return retryData;
          }
          
          console.error('❌ Profile fetch failed even after retry:', retryError);
          return null;
        }
        
        console.error('❌ Error fetching user profile:', error);
        return null;
      }

      if (!data) {
        console.log('⚠️ No profile data returned, but no error');
        return null;
      }

      console.log('✅ Profile fetched successfully:', data);
      return data;
    } catch (err) {
      console.error('💥 Unexpected error in fetchUserProfile:', err);
      return null;
    } finally {
      fetchingProfileRef.current = false;
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
