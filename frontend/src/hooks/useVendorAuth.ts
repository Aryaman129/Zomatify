import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { vendorService, Vendor } from '../services/enhancedApi';
import { toast } from 'react-toastify';

interface VendorAuthState {
  vendor: Vendor | null;
  loading: boolean;
  error: string | null;
  isVendorOwner: boolean;
  hasVendorAccess: boolean;
}

export const useVendorAuth = () => {
  const { user, profile } = useAuth();
  const [vendorState, setVendorState] = useState<VendorAuthState>({
    vendor: null,
    loading: true,
    error: null,
    isVendorOwner: false,
    hasVendorAccess: false
  });

  useEffect(() => {
    const loadVendorData = async () => {
      if (!user || !profile) {
        setVendorState({
          vendor: null,
          loading: false,
          error: 'User not authenticated',
          isVendorOwner: false,
          hasVendorAccess: false
        });
        return;
      }

      // Check if user has vendor access (shopkeeper or admin)
      const hasAccess = profile.role === 'shopkeeper' || profile.role === 'admin';
      
      if (!hasAccess) {
        setVendorState({
          vendor: null,
          loading: false,
          error: 'Access denied: User is not a vendor',
          isVendorOwner: false,
          hasVendorAccess: false
        });
        return;
      }

      try {
        setVendorState(prev => ({ ...prev, loading: true, error: null }));
        
        const result = await vendorService.getCurrentVendor();
        
        if (result.success && result.data) {
          setVendorState({
            vendor: result.data,
            loading: false,
            error: null,
            isVendorOwner: result.data.owner_id === user.id,
            hasVendorAccess: true
          });
        } else {
          // No vendor found - might need to create one
          setVendorState({
            vendor: null,
            loading: false,
            error: result.error || 'No vendor found for this user',
            isVendorOwner: false,
            hasVendorAccess: true
          });
        }
      } catch (error: any) {
        console.error('Error loading vendor data:', error);
        setVendorState({
          vendor: null,
          loading: false,
          error: error.message || 'Failed to load vendor data',
          isVendorOwner: false,
          hasVendorAccess: true
        });
      }
    };

    loadVendorData();
  }, [user, profile]);

  const createVendor = async (vendorData: Partial<Vendor>) => {
    if (!vendorState.hasVendorAccess) {
      toast.error('Access denied: Cannot create vendor');
      return { success: false, error: 'Access denied' };
    }

    try {
      setVendorState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await vendorService.createVendor(vendorData);
      
      if (result.success && result.data) {
        setVendorState({
          vendor: result.data || null,
          loading: false,
          error: null,
          isVendorOwner: true,
          hasVendorAccess: true
        });
        toast.success('Vendor created successfully');
        return { success: true, data: result.data };
      } else {
        setVendorState(prev => ({ ...prev, loading: false, error: result.error || null }));
        toast.error(result.error || 'Failed to create vendor');
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create vendor';
      setVendorState(prev => ({ ...prev, loading: false, error: errorMessage }));
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateVendor = async (vendorData: Partial<Vendor>) => {
    if (!vendorState.vendor || !vendorState.isVendorOwner) {
      toast.error('Access denied: Cannot update vendor');
      return { success: false, error: 'Access denied' };
    }

    try {
      setVendorState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await vendorService.updateVendor(vendorState.vendor.id, vendorData);
      
      if (result.success && result.data) {
        setVendorState(prev => ({
          ...prev,
          vendor: result.data || null,
          loading: false,
          error: null
        }));
        toast.success('Vendor updated successfully');
        return { success: true, data: result.data };
      } else {
        setVendorState(prev => ({ ...prev, loading: false, error: result.error || null }));
        toast.error(result.error || 'Failed to update vendor');
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update vendor';
      setVendorState(prev => ({ ...prev, loading: false, error: errorMessage }));
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const requireVendorAccess = () => {
    if (!vendorState.hasVendorAccess) {
      throw new Error('Access denied: Vendor access required');
    }
  };

  const requireVendorOwnership = () => {
    if (!vendorState.isVendorOwner) {
      throw new Error('Access denied: Vendor ownership required');
    }
  };

  return {
    ...vendorState,
    createVendor,
    updateVendor,
    requireVendorAccess,
    requireVendorOwnership,
    refetch: () => {
      // Trigger re-fetch by updating a dependency
      setVendorState(prev => ({ ...prev, loading: true }));
    }
  };
};
