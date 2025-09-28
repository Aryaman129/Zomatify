import supabase from './supabaseClient';
import {
  User,
  MenuItem,
  Order,
  OrderStatus,
  ScheduledOrder,
  Notification,
  ApiResponse,
  CartItem,
  PaymentDetails,
  PaymentResponse,
  PaymentStatus,
  QueueStatus
} from '../types/index';
import { normalizeQueueStatus, normalizeOrderItems } from '../utils/formatters';
import { normalizeMenuItem } from '../utils/normalizers';

interface QueueSettings {
  max_active_orders: number;
  is_accepting_orders: boolean;
  interval_minutes: number;
  last_interval_time: string;
}

// Add retry logic for Supabase requests
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function retryRequest<T>(
  request: () => Promise<{ data: T | null; error: any }>,
  retries = MAX_RETRIES
): Promise<{ data: T | null; error: any }> {
  try {
    return await request();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return retryRequest(request, retries - 1);
    }
    throw error;
  }
}

// Auth Services
export const authService = {
  // Sign up a new user
  async signUp(email: string, password: string, firstName: string, lastName: string, phone?: string): Promise<ApiResponse<User>> {
    try {
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

      if (data.user) {
        // Create a user record in the profiles table
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

        if (profileError) throw profileError;
      }

      return {
        success: true,
        data: data.user as unknown as User
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Sign in a user
  async signIn(email: string, password: string): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Get the user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      return {
        success: true,
        data: profileData as User
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Sign out the current user
  async signOut(): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      return {
        success: true
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get the current user
  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;

      if (!data.user) {
        return {
          success: false,
          error: 'No user logged in'
        };
      }

      // Get the user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      return {
        success: true,
        data: profileData as User
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Update user profile
  async updateProfile(userId: string, profileData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as User
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// Menu Services
export const menuService = {
  // Get all menu items
  async getMenuItems(vendorId?: string): Promise<ApiResponse<MenuItem[]>> {
    try {
      let query = supabase
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true });

      if (vendorId) {
        query = query.eq('vendor_id', vendorId);
      }

      const { data, error } = await retryRequest<MenuItem[]>(() => query);

      if (error) throw error;

      return {
        success: true,
        data: (data || []).map(item => normalizeMenuItem(item))
      };
    } catch (error) {
      console.error('Error fetching menu items:', error);
      return {
        success: false,
        error: 'Failed to fetch menu items'
      };
    }
  },

  // Get menu items by category
  async getMenuItemsByCategory(category: string): Promise<ApiResponse<MenuItem[]>> {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('category', category)
        .eq('available', true)
        .order('name', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        data: data as MenuItem[]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get menu item by ID
  async getMenuItemById(id: string): Promise<ApiResponse<MenuItem>> {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as MenuItem
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get personalized recommendations for a user
  async getRecommendations(userId: string): Promise<ApiResponse<MenuItem[]>> {
    try {
      // This query would typically call a function in Supabase or a complex query
      // For demonstration, we'll fetch the most popular items
      const { data, error } = await supabase
        .rpc('get_user_recommendations', { user_id: userId })
        .limit(5);

      if (error) throw error;

      return {
        success: true,
        data: data as MenuItem[]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  updateMenuItem: async (menuItem: Partial<MenuItem> & { id?: number }): Promise<MenuItem | null> => {
    try {
      if (!menuItem.id) {
        // Create new menu item
        const { data, error } = await supabase
          .from('menu_items')
          .insert([menuItem])
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Update existing menu item
        const { data, error } = await supabase
          .from('menu_items')
          .update(menuItem)
          .eq('id', menuItem.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error updating menu item:', error);
      return null;
    }
  }
};

// Order Services
export const orderService = {
  // Create a new order via backend API
  async createOrder(order: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Order>> {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(order)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          success: false,
          error: result.error || 'Failed to create order'
        };
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('Error creating order:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create order'
      };
    }
  },

  // Backup method: Create order directly via Supabase (for fallback)
  async createOrderDirect(order: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Order>> {
    try {
      // Generate sequential bill number for the vendor
      let billNumber = 1;
      if (order.vendor_id) {
        const { data: lastOrder } = await supabase
          .from('orders')
          .select('bill_number')
          .eq('vendor_id', order.vendor_id)
          .order('bill_number', { ascending: false })
          .limit(1)
          .single();

        if (lastOrder && lastOrder.bill_number) {
          billNumber = lastOrder.bill_number + 1;
        }
      }

      // Map to correct schema columns (database uses total_price, not total)
      const payload: any = {
        user_id: order.user_id,
        vendor_id: order.vendor_id, // CRITICAL: Include vendor_id for real-time sync
        items: order.items,
        total_price: order.total_price, // Correct column name
        status: order.status ?? 'pending',
        payment_status: order.payment_status ?? 'pending',
        payment_method: order.payment_method ?? 'cod',
        payment_id: order.payment_id,
        delivery_address: order.delivery_address,
        scheduled_for: order.scheduled_for,
        special_instructions: order.special_instructions,
        group_order_id: order.group_order_id,
        queue_position: order.queue_position,
        bill_number: billNumber,
        bill_date: new Date().toISOString(),
        order_type: order.order_type ?? 'delivery'
      };

      const { data, error } = await supabase
        .from('orders')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as Order
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get orders for a user
  async getUserOrders(userId: string): Promise<ApiResponse<Order[]>> {
    try {
      const { data, error } = await retryRequest<Order[]>(() =>
        supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
          .order('created_at', { ascending: false })
      );

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Error fetching orders:', error);
      return {
        success: false,
        error: 'Failed to fetch orders'
      };
    }
  },

  // Get a specific order
  async getOrder(orderId: string): Promise<ApiResponse<Order>> {
    try {
      const { data, error } = await retryRequest<Order>(() =>
        supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()
      );

      if (error) throw error;

      return {
        success: true,
        data: data || undefined
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get order by ID
  async getOrderById(id: string): Promise<ApiResponse<Order>> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as Order
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get all orders for the shop (for shopkeeper dashboard)
  async getShopOrders(): Promise<ApiResponse<Order[]>> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the raw data to match our Order type  
      const orders = data.map((order: any) => {
        // Items are already stored in the order.items JSONB column
        const items = (order.items || []).map((item: any) => ({
          id: item.menu_item_id,
          menuItem: item.menu_item,
          quantity: item.quantity,
          specialInstructions: item.special_instructions
        }));

        return {
          ...order,
          items
        } as Order;
      });

      return {
        success: true,
        data: orders
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get active orders that need to be fulfilled (for shopkeepers)
  async getActiveOrders(): Promise<ApiResponse<Order[]>> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['pending', 'accepted', 'preparing'])
        .order('created_at', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        data: data as Order[]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Update order status - USE BACKEND VENDOR API
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<ApiResponse<Order>> {
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
      return {
        success: true,
        data: data.order as Order
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Cancel an order - USE BACKEND VENDOR API
  async cancelOrder(orderId: string, reason?: string): Promise<ApiResponse<Order>> {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/vendor/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ status: 'cancelled', reason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.order as Order
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get vendor orders
  async getVendorOrders(vendorId: string): Promise<ApiResponse<Order[]>> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data as Order[] || []
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Create a scheduled order
  async createScheduledOrder(scheduledOrder: Omit<ScheduledOrder, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<ScheduledOrder>> {
    try {
      const { data, error } = await supabase
        .from('scheduled_orders')
        .insert(scheduledOrder)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as ScheduledOrder
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get scheduled orders for a user
  async getScheduledOrders(): Promise<ApiResponse<ScheduledOrder[]>> {
    try {
      // Get the current user
      const { data: authData } = await supabase.auth.getSession();
      
      if (!authData.session) {
        throw new Error('No authenticated user');
      }
      
      const userId = authData.session.user.id;
      
      const { data, error } = await supabase
        .from('scheduled_orders')
        .select('*')
        .eq('user_id', userId)
        .order('pickup_date', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        data: data as ScheduledOrder[]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // Get scheduled orders for a user (legacy method)
  async getUserScheduledOrders(userId: string): Promise<ApiResponse<ScheduledOrder[]>> {
    try {
      const { data, error } = await supabase
        .from('scheduled_orders')
        .select('*')
        .eq('user_id', userId)
        .order('pickup_date', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        data: data as ScheduledOrder[]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // Update a scheduled order
  async updateScheduledOrder(id: string, updates: Partial<ScheduledOrder>): Promise<ApiResponse<ScheduledOrder>> {
    try {
      const { data, error } = await supabase
        .from('scheduled_orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as ScheduledOrder
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // Cancel a scheduled order
  async cancelScheduledOrder(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('scheduled_orders')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;

      return {
        success: true
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};







// Notification Services
export const notificationService = {
  // Create a new order status notification
  async createOrderStatusNotification(notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Notification>> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert(notification)
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
  
  // Get notifications for current user
  async getUserNotifications(): Promise<ApiResponse<Notification[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

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

  // Get unread notifications count
  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');
      
      const { data, error, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      return {
        success: true,
        data: { count: count || 0 }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Mark a notification as read
  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      return {
        success: true
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // Mark all notifications as read
  async markAllNotificationsAsRead(): Promise<ApiResponse<null>> {
    try {
      // Get the current user
      const { data: authData } = await supabase.auth.getSession();
      
      if (!authData.session) {
        throw new Error('No authenticated user');
      }
      
      const userId = authData.session.user.id;
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;

      return {
        success: true
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Create a general notification
  async createNotification(notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Notification>> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert(notification)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as Notification
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// Payment Services
export const paymentService = {
  // Create a new Razorpay order
  async createRazorpayOrder(amount: number, orderId: string): Promise<ApiResponse<PaymentResponse>> {
    try {
      const resp = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/payments/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, orderReference: orderId, currency: 'INR' })
      });
      if (!resp.ok) throw new Error(`Create order failed: ${resp.status}`);
      const data = await resp.json();
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Verify Razorpay payment
  async verifyRazorpayPayment(
    paymentId: string, 
    orderId: string, 
    signature: string
  ): Promise<ApiResponse<{ verified: boolean }>> {
    try {
      const resp = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/payments/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, orderId, signature })
      });
      if (!resp.ok) throw new Error(`Verify failed: ${resp.status}`);
      const data = await resp.json();
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Update order payment status - USE BACKEND API
  async updatePaymentStatus(
    orderId: string,
    paymentId: string,
    status: PaymentStatus
  ): Promise<ApiResponse<null>> {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/orders/${orderId}/payment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          payment_id: paymentId,
          payment_status: status,
          status: status === 'paid' ? 'completed' : 'pending'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return {
        success: true
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// Queue Management Services
export const queueService = {
  // Get current queue status
  async getQueueStatus(vendorId?: string): Promise<ApiResponse<QueueStatus>> {
    try {
      const { data: settings, error: settingsError } = await retryRequest<QueueSettings>(() =>
        supabase
          .from('queue_settings')
          .select('*')
          .single()
      );
        
      if (settingsError) {
        console.log('Queue settings not available, using defaults:', settingsError);
        
        // Return a normalized default QueueStatus
        return {
          success: true,
          data: normalizeQueueStatus({})
        };
      }
      
      const { data: activeOrders, error: ordersError } = await retryRequest<Order[]>(() =>
        supabase
          .from('orders')
          .select('*')
          .in('status', ['pending', 'accepted'])
          .order('created_at', { ascending: true })
      );

      if (ordersError) {
        console.error('Error fetching active orders:', ordersError);
        
        // Return a normalized QueueStatus with settings data
        return {
          success: true,
          data: normalizeQueueStatus({
            max_active_orders: settings?.max_active_orders || 10,
            is_accepting_orders: settings?.is_accepting_orders || true,
            next_interval_time: new Date(settings?.last_interval_time ? 
              new Date(settings.last_interval_time).getTime() + (settings.interval_minutes * 60 * 1000) : 
              Date.now() + 10 * 60 * 1000).toISOString(),
            interval_minutes: settings?.interval_minutes || 10
          })
        };
      }

      const currentPosition = activeOrders?.length || 0;
      const isAcceptingOrders = Boolean(settings?.is_accepting_orders) && currentPosition < (settings?.max_active_orders || 10);
      
      const estimatedWaitTime = currentPosition * 10; // 10 minutes per order
      const nextIntervalTime = new Date(settings?.last_interval_time ? 
        new Date(settings.last_interval_time).getTime() + (settings.interval_minutes * 60 * 1000) : 
        Date.now() + 10 * 60 * 1000).toISOString();
      const cooldownRemaining = Math.max(0, (new Date(nextIntervalTime).getTime() - Date.now()) / 1000 / 60);

      // Return a normalized QueueStatus with all data
      return {
        success: true,
        data: normalizeQueueStatus({
          current_position: currentPosition,
          max_active_orders: settings?.max_active_orders || 10,
          is_accepting_orders: isAcceptingOrders,
          estimated_wait_time: estimatedWaitTime,
          next_interval_time: nextIntervalTime,
          cooldown_remaining: cooldownRemaining,
          interval_minutes: settings?.interval_minutes || 10,
          active_orders_count: currentPosition
        })
      };
    } catch (error) {
      console.error('Error in getQueueStatus:', error);
      
      // Return a normalized default QueueStatus in case of error
      return {
        success: true,
        data: normalizeQueueStatus({})
      };
    }
  },

  // Update queue settings
  async updateQueueSettings(settings: {
    maxActiveOrders: number;
    intervalMinutes: number;
    isAcceptingOrders: boolean;
  }): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('queue_settings')
        .upsert({
          max_active_orders: settings.maxActiveOrders,
          interval_minutes: settings.intervalMinutes,
          is_accepting_orders: settings.isAcceptingOrders,
          updated_at: new Date().toISOString()
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
  }
};

// Analytics Services (for shopkeeper dashboard)
export const analyticsService = {
  // Get sales analytics
  async getSalesAnalytics(period: 'day' | 'week' | 'month' = 'week'): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .rpc('get_sales_analytics', { time_period: period });

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

  // Get popular items
  async getPopularItems(limit: number = 5): Promise<ApiResponse<any>> {
    try {
      // Get the current date
      const currentDate = new Date();
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      const startDateStr = startDate.toISOString();
      
      // Get popular items from orders.items JSONB column
      const { data: orders, error: itemsError } = await supabase
        .from('orders')
        .select('items')
        .gte('created_at', startDateStr)
        .not('items', 'is', null);

      if (itemsError) throw itemsError;
      
      // Process the popular items from orders.items JSONB
      const itemCounts: { [key: string]: { name: string, quantity: number, revenue: number } } = {};
      
      orders?.forEach((order: any) => {
        order.items?.forEach((item: any) => {
          const menuItemId = item.menu_item_id;
          const menuItemName = item.menu_item?.name || 'Unknown Item';
          const price = item.menu_item?.price || 0;
          const quantity = item.quantity || 0;
          
          if (itemCounts[menuItemId]) {
            itemCounts[menuItemId].quantity += quantity;
            itemCounts[menuItemId].revenue += price * quantity;
          } else {
            itemCounts[menuItemId] = {
              name: menuItemName,
              quantity: quantity,
              revenue: price * quantity
            };
          }
        });
      });
      
      const processedItems = Object.entries(itemCounts)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, limit);

      return {
        success: true,
        data: processedItems
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// Vendor Payment Distribution Service
export const vendorPaymentService = {
  // Create payment distribution for vendor
  async createPaymentDistribution(
    orderId: string,
    vendorId: string,
    razorpayPaymentId: string,
    amount: number,
    platformFeePercentage: number = 5
  ): Promise<ApiResponse<any>> {
    try {
      const platformFee = (amount * platformFeePercentage) / 100;
      const vendorAmount = amount - platformFee;

      // Get vendor UPI ID
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('upi_id, business_name')
        .eq('id', vendorId)
        .single();

      if (vendorError || !vendor?.upi_id) {
        return {
          success: false,
          error: 'Vendor UPI ID not found'
        };
      }

      // Create payment distribution record
      const { data, error } = await supabase
        .from('vendor_payment_distributions')
        .insert({
          order_id: orderId,
          vendor_id: vendorId,
          razorpay_payment_id: razorpayPaymentId,
          vendor_upi_id: vendor.upi_id,
          amount: amount,
          platform_fee: platformFee,
          vendor_amount: vendorAmount,
          transfer_status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Initiate transfer to vendor UPI (this would be done via Razorpay API)
      // For now, we'll mark it as processing
      await supabase
        .from('vendor_payment_distributions')
        .update({
          transfer_status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id);

      return {
        success: true,
        data: {
          ...data,
          vendor_name: vendor.business_name,
          transfer_status: 'processing'
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get vendor payment distributions
  async getVendorPaymentDistributions(vendorId: string): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('vendor_payment_distributions')
        .select(`
          *,
          orders!inner(
            id,
            total_price,
            created_at,
            delivery_address
          )
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

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

  // Update transfer status (webhook handler)
  async updateTransferStatus(
    distributionId: string,
    status: string,
    transferId?: string,
    transferResponse?: any
  ): Promise<ApiResponse<any>> {
    try {
      const updateData: any = {
        transfer_status: status,
        updated_at: new Date().toISOString()
      };

      if (transferId) {
        updateData.transfer_id = transferId;
      }

      if (transferResponse) {
        updateData.transfer_response = transferResponse;
      }

      if (status === 'completed') {
        updateData.transferred_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('vendor_payment_distributions')
        .update(updateData)
        .eq('id', distributionId)
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
