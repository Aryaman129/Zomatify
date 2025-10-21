import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'react-toastify';
import supabase from '../services/supabaseClient';

interface Vendor {
  id: string;
  business_name: string;
  vendor_email: string;
  is_active: boolean;
  upi_id?: string;
  payment_details?: any;
  last_login?: string;
}

interface VendorAuthState {
  vendor: Vendor | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

interface VendorAuthContextType extends VendorAuthState {
  loginVendor: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logoutVendor: () => void;
  refreshVendorData: () => Promise<void>;
}

const VendorAuthContext = createContext<VendorAuthContextType | undefined>(undefined);

export const useVendorAuth = () => {
  const context = useContext(VendorAuthContext);
  if (context === undefined) {
    throw new Error('useVendorAuth must be used within a VendorAuthProvider');
  }
  return context;
};

interface VendorAuthProviderProps {
  children: ReactNode;
}

export const VendorAuthProvider: React.FC<VendorAuthProviderProps> = ({ children }) => {
  const [vendorState, setVendorState] = useState<VendorAuthState>({
    vendor: null,
    loading: true,
    error: null,
    isAuthenticated: false
  });

  // Check for existing vendor session on mount - only if on vendor routes
  useEffect(() => {
    // Only check vendor session if we're on a vendor route
    const currentPath = window.location.pathname;
    const isVendorRoute = currentPath.includes('/vendor') || 
                         currentPath.includes('/dashboard') ||
                         currentPath.includes('/pickup') ||
                         currentPath.includes('/delivery');
    
    if (isVendorRoute) {
      checkVendorSession();
    } else {
      // Set initial state for non-vendor routes without making API calls
      setVendorState({
        vendor: null,
        loading: false,
        error: null,
        isAuthenticated: false
      });
    }
  }, []);

  const checkVendorSession = async () => {
    try {
      console.log('🏪 VendorAuth: Checking vendor session...');
      const vendorData = localStorage.getItem('vendor_session');
      if (vendorData) {
        let vendor;
        try {
          vendor = JSON.parse(vendorData);
        } catch (parseError) {
          console.error('🏪 VendorAuth: Failed to parse vendor session, clearing corrupted data');
          localStorage.removeItem('vendor_session');
          setVendorState({
            vendor: null,
            loading: false,
            error: 'Corrupted session data',
            isAuthenticated: false
          });
          return;
        }
        
        // Validate vendor object has required fields
        if (!vendor || typeof vendor !== 'object' || !vendor.id || typeof vendor.id !== 'string') {
          console.error('🏪 VendorAuth: Invalid vendor session structure:', vendor);
          localStorage.removeItem('vendor_session');
          setVendorState({
            vendor: null,
            loading: false,
            error: 'Invalid session structure',
            isAuthenticated: false
          });
          return;
        }
        
        console.log('🏪 VendorAuth: Found stored vendor session, verifying vendor ID:', vendor.id);
        // Verify vendor is still active
        const { data, error } = await supabase
          .from('vendors')
          .select('id, business_name, vendor_email, is_active, upi_id, payment_details, last_login')
          .eq('id', vendor.id)
          .eq('is_active', true)
          .maybeSingle();

        if (error || !data) {
          console.log('🏪 VendorAuth: Vendor verification failed, clearing session');
          localStorage.removeItem('vendor_session');
          setVendorState({
            vendor: null,
            loading: false,
            error: null,
            isAuthenticated: false
          });
          return;
        }

        console.log('🏪 VendorAuth: Vendor session verified');
        setVendorState({
          vendor: data,
          loading: false,
          error: null,
          isAuthenticated: true
        });
      } else {
        console.log('🏪 VendorAuth: No stored vendor session found');
        setVendorState({
          vendor: null,
          loading: false,
          error: null,
          isAuthenticated: false
        });
      }
    } catch (error) {
      console.error('🏪 VendorAuth: Error checking vendor session:', error);
      setVendorState({
        vendor: null,
        loading: false,
        error: 'Session check failed',
        isAuthenticated: false
      });
    }
  };

  const loginVendor = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setVendorState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Call the vendor authentication function
      const { data, error } = await supabase.rpc('authenticate_vendor', {
        p_email: email,
        p_password: password
      });

      if (error) {
        setVendorState(prev => ({ ...prev, loading: false, error: error.message }));
        return { success: false, error: error.message };
      }

      if (data && data.length > 0) {
        const vendorData = data[0];
        
        if (vendorData.success) {
          const vendor: Vendor = {
            id: vendorData.vendor_id,
            business_name: vendorData.vendor_name,
            vendor_email: vendorData.vendor_email,
            is_active: vendorData.is_active
          };

          console.log('🏪 VendorAuth: Login successful, storing vendor session:', {
            id: vendor.id,
            business_name: vendor.business_name,
            vendor_email: vendor.vendor_email
          });

          // Store vendor session
          localStorage.setItem('vendor_session', JSON.stringify(vendor));

          setVendorState({
            vendor,
            loading: false,
            error: null,
            isAuthenticated: true
          });

          return { success: true };
        } else {
          setVendorState(prev => ({ ...prev, loading: false, error: vendorData.message }));
          return { success: false, error: vendorData.message };
        }
      } else {
        setVendorState(prev => ({ ...prev, loading: false, error: 'Invalid response from server' }));
        return { success: false, error: 'Invalid response from server' };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';
      setVendorState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  };

  const logoutVendor = () => {
    localStorage.removeItem('vendor_session');
    setVendorState({
      vendor: null,
      loading: false,
      error: null,
      isAuthenticated: false
    });
    toast.success('Logged out successfully');
  };

  const refreshVendorData = async () => {
    if (!vendorState.vendor) return;

    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, business_name, vendor_email, is_active, upi_id, payment_details, last_login')
        .eq('id', vendorState.vendor.id)
        .single();

      if (error) {
        console.error('Error refreshing vendor data:', error);
        return;
      }

      if (data) {
        const updatedVendor = { ...vendorState.vendor, ...data };
        localStorage.setItem('vendor_session', JSON.stringify(updatedVendor));
        setVendorState(prev => ({
          ...prev,
          vendor: updatedVendor
        }));
      }
    } catch (error) {
      console.error('Error refreshing vendor data:', error);
    }
  };

  const contextValue: VendorAuthContextType = {
    ...vendorState,
    loginVendor,
    logoutVendor,
    refreshVendorData
  };

  return (
    <VendorAuthContext.Provider value={contextValue}>
      {children}
    </VendorAuthContext.Provider>
  );
};

export default VendorAuthContext;
