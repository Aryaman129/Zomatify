import supabase from './supabaseClient';

// Vendor Backend API Service - Uses backend vendor routes instead of direct Supabase
export const vendorApiService = {
  // Update order status via backend API
  async updateOrderStatus(orderId: string, status: string): Promise<any> {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/vendor/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ status }),
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
