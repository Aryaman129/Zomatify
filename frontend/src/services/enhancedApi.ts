import supabase from './supabaseClient';
import { ApiResponse } from '../types/index';

// Vendor types
export interface Vendor {
  id: string;
  owner_id: string;
  business_name: string;
  business_type: string;
  description?: string;
  address?: any;
  phone_number?: string;
  email?: string;
  business_hours?: any;
  logo_url?: string;
  banner_url?: string;
  is_active: boolean;
  is_verified: boolean;
  rating: number;
  total_reviews: number;
  delivery_fee: number;
  minimum_order_amount: number;
  estimated_delivery_time: number;
  created_at: string;
  updated_at: string;
}

// Vendor Service
export const vendorService = {
  // Get current user's vendor
  async getCurrentVendor(): Promise<ApiResponse<Vendor>> {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('owner_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Create vendor
  async createVendor(vendorData: Partial<Vendor>): Promise<ApiResponse<Vendor>> {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .insert({
          ...vendorData,
          owner_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Update vendor
  async updateVendor(vendorId: string, vendorData: Partial<Vendor>): Promise<ApiResponse<Vendor>> {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .update(vendorData)
        .eq('id', vendorId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// Enhanced Analytics Service
export const enhancedAnalyticsService = {
  // Get comprehensive sales analytics for current vendor
  async getSalesAnalytics(period: 'day' | 'week' | 'month' = 'week'): Promise<ApiResponse<any>> {
    try {
      // Get current vendor
      const vendorResult = await vendorService.getCurrentVendor();
      if (!vendorResult.success || !vendorResult.data) {
        throw new Error('No vendor found for current user');
      }

      const { data, error } = await supabase
        .rpc('get_vendor_sales_analytics', {
          time_period: period,
          vendor_id: vendorResult.data.id
        });

      if (error) throw error;

      return {
        success: true,
        data: data[0] || {
          total_orders: 0,
          total_revenue: 0,
          average_order_value: 0,
          completion_rate: 0
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get popular items with detailed analytics
  async getPopularItems(limit: number = 5, period: 'day' | 'week' | 'month' = 'week'): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .rpc('get_popular_items', { item_limit: limit, time_period: period });

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get peak hours analytics
  async getPeakHours(period: 'day' | 'week' | 'month' = 'week'): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .rpc('get_peak_hours', { time_period: period });

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get status distribution
  async getStatusDistribution(period: 'day' | 'week' | 'month' = 'week'): Promise<ApiResponse<any>> {
    try {
      const startDate = new Date();
      if (period === 'day') {
        startDate.setHours(0, 0, 0, 0);
      } else if (period === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === 'month') {
        startDate.setDate(startDate.getDate() - 30);
      }

      const { data, error } = await supabase
        .from('orders')
        .select('status')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const distribution = data.reduce((acc: any, order: any) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});

      return {
        success: true,
        data: distribution
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// Enhanced Inventory Service
export const inventoryService = {
  // Get inventory status for all menu items
  async getInventoryStatus(): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('menu_item_inventory')
        .select(`
          *,
          menu_item:menu_items(id, name, price, is_available)
        `);

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Update inventory for a menu item
  async updateInventory(menuItemId: string, stockQuantity: number, lowStockThreshold?: number): Promise<ApiResponse<any>> {
    try {
      const updateData: any = {
        stock_quantity: stockQuantity,
        updated_at: new Date().toISOString()
      };

      if (lowStockThreshold !== undefined) {
        updateData.low_stock_threshold = lowStockThreshold;
      }

      const { data, error } = await supabase
        .from('menu_item_inventory')
        .upsert({
          menu_item_id: menuItemId,
          ...updateData
        })
        .select();

      if (error) throw error;

      return {
        success: true,
        data: data[0]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get low stock items
  async getLowStockItems(): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('menu_item_inventory')
        .select(`
          *,
          menu_item:menu_items(id, name, price, is_available)
        `)
        .filter('stock_quantity', 'lte', 'low_stock_threshold');

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Restock item
  async restockItem(menuItemId: string, additionalStock: number): Promise<ApiResponse<any>> {
    try {
      // First get current stock
      const { data: currentData, error: fetchError } = await supabase
        .from('menu_item_inventory')
        .select('stock_quantity')
        .eq('menu_item_id', menuItemId)
        .single();

      if (fetchError) throw fetchError;

      const newStock = (currentData?.stock_quantity || 0) + additionalStock;

      const { data, error } = await supabase
        .from('menu_item_inventory')
        .update({
          stock_quantity: newStock,
          last_restocked_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('menu_item_id', menuItemId)
        .select();

      if (error) throw error;

      // Re-enable item if it was disabled due to stock
      await supabase
        .from('menu_items')
        .update({ is_available: true })
        .eq('id', menuItemId);

      return {
        success: true,
        data: data[0]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// Enhanced Communication Service
export const communicationService = {
  // Get customer notifications
  async getCustomerNotifications(userId: string, limit: number = 50): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('customer_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Send custom notification to customer
  async sendCustomNotification(
    userId: string, 
    orderId: string, 
    title: string, 
    message: string
  ): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('customer_notifications')
        .insert({
          user_id: userId,
          order_id: orderId,
          notification_type: 'custom',
          title,
          message
        })
        .select();

      if (error) throw error;

      return {
        success: true,
        data: data[0]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get order messages
  async getOrderMessages(orderId: string): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('shopkeeper_messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Send message to customer
  async sendMessageToCustomer(orderId: string, message: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('shopkeeper_messages')
        .insert({
          order_id: orderId,
          from_shopkeeper: true,
          message
        })
        .select();

      if (error) throw error;

      return {
        success: true,
        data: data[0]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Mark notifications as read
  async markNotificationsAsRead(notificationIds: string[]): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('customer_notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .in('id', notificationIds)
        .select();

      if (error) throw error;

      return {
        success: true,
        data: data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// Enhanced Order Service
export const enhancedOrderService = {
  // Get orders with advanced filtering
  async getOrdersWithFilters(filters: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    searchTerm?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<any>> {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          profiles(first_name, last_name, phone_number)
        `);

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      if (filters.searchTerm) {
        query = query.or(`id.ilike.%${filters.searchTerm}%,delivery_address->>fullName.ilike.%${filters.searchTerm}%`);
      }

      // Apply sorting
      if (filters.sortBy) {
        query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        success: true,
        data: {
          orders: data || [],
          total: count || 0
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Bulk update order status
  async bulkUpdateOrderStatus(orderIds: string[], newStatus: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .in('id', orderIds)
        .select();

      if (error) throw error;

      return {
        success: true,
        data: data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};
