import supabase from './supabaseClient';

// Vendor Backend API Service - Uses backend vendor routes instead of direct Supabase
export const vendorApiService = {
  // Update order status via backend API
  async updateOrderStatus(orderId: string, status: string, vendorId?: string): Promise<any> {
    try {
      // Get vendor_id from localStorage if not provided
      const vendorSession = localStorage.getItem('vendor_session');
      const vendor_id = vendorId || (vendorSession ? JSON.parse(vendorSession).id : null);
      
      if (!vendor_id) {
        throw new Error('Vendor ID not found');
      }

      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
      if (!apiBaseUrl) {
        throw new Error('API Base URL not configured. Please set REACT_APP_API_BASE_URL environment variable.');
      }

      const response = await fetch(`${apiBaseUrl}/api/vendor/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, vendor_id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};
