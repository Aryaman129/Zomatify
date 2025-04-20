import supabase from './supabaseClient';
import { 
  User, 
  MenuItem, 
  Order, 
  OrderStatus, 
  GroupOrder, 
  ScheduledOrder, 
  Notification,
  ApiResponse,
  CartItem,
  PaymentDetails,
  PaymentResponse,
  PaymentStatus,
  QueueStatus
} from '../types';

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
  async getMenuItems(): Promise<ApiResponse<MenuItem[]>> {
    try {
      const { data, error } = await retryRequest<MenuItem[]>(() =>
        supabase
          .from('menu_items')
          .select('*')
          .order('category', { ascending: true })
      );

      if (error) throw error;

      return {
        success: true,
        data: data || []
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
  }
};

// Order Services
export const orderService = {
  // Create a new order
  async createOrder(order: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Order>> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert(order)
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
      const orders = await Promise.all(data.map(async (order: any) => {
        // Get menu items for each order
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('*, menu_item:menu_items(*)')
          .eq('order_id', order.id);

        // Format the order items to match our CartItem type
        const items = orderItems.map((item: any) => ({
          id: item.id,
          menuItem: item.menu_item,
          quantity: item.quantity,
          specialInstructions: item.special_instructions
        }));

        return {
          ...order,
          items
        } as Order;
      }));

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

  // Update order status
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<ApiResponse<Order>> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId)
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
  },
  
  // Cancel an order
  async cancelOrder(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('orders')
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

// Group Order Services
export const groupOrderService = {
  // Create a new group order
  async createGroupOrder(
    creatorId: string, 
    name: string, 
    expiryTime: string
  ): Promise<ApiResponse<GroupOrder>> {
    try {
      const invitationLink = `${window.location.origin}/group-order/join/${Math.random().toString(36).substring(2, 10)}`;
      
      const { data, error } = await supabase
        .from('group_orders')
        .insert({
          creator_id: creatorId,
          name,
          status: 'open',
          expiry_time: expiryTime,
          invitation_link: invitationLink,
          participants: [{
            user_id: creatorId,
            name: 'You (Creator)',
            items: [],
            has_confirmed: false
          }]
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as GroupOrder
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get a group order by ID
  async getGroupOrderById(groupOrderId: string): Promise<ApiResponse<GroupOrder>> {
    try {
      const { data, error } = await supabase
        .from('group_orders')
        .select('*')
        .eq('id', groupOrderId)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as GroupOrder
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get group orders created by a user
  async getUserGroupOrders(userId: string): Promise<ApiResponse<GroupOrder[]>> {
    try {
      const { data, error } = await supabase
        .from('group_orders')
        .select('*')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data as GroupOrder[]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Join a group order
  async joinGroupOrder(
    groupOrderId: string, 
    userId: string, 
    userName: string
  ): Promise<ApiResponse<GroupOrder>> {
    try {
      // Get the current group order
      const { data: groupOrder, error: fetchError } = await supabase
        .from('group_orders')
        .select('*')
        .eq('id', groupOrderId)
        .single();

      if (fetchError) throw fetchError;

      // Check if the user is already a participant
      const existingParticipantIndex = groupOrder.participants.findIndex(
        (p: any) => p.user_id === userId
      );

      if (existingParticipantIndex === -1) {
        // Add the new participant
        groupOrder.participants.push({
          user_id: userId,
          name: userName,
          items: [],
          has_confirmed: false
        });
      }

      // Update the group order
      const { data, error } = await supabase
        .from('group_orders')
        .update({
          participants: groupOrder.participants,
          updated_at: new Date().toISOString()
        })
        .eq('id', groupOrderId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as GroupOrder
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Update a participant's items in a group order
  async updateGroupOrderItems(
    groupOrderId: string, 
    userId: string, 
    items: CartItem[]
  ): Promise<ApiResponse<GroupOrder>> {
    try {
      // Get the current group order
      const { data: groupOrder, error: fetchError } = await supabase
        .from('group_orders')
        .select('*')
        .eq('id', groupOrderId)
        .single();

      if (fetchError) throw fetchError;

      // Find the participant and update their items
      const participantIndex = groupOrder.participants.findIndex(
        (p: any) => p.user_id === userId
      );

      if (participantIndex === -1) {
        throw new Error('User is not a participant in this group order');
      }

      groupOrder.participants[participantIndex].items = items;

      // Update the group order
      const { data, error } = await supabase
        .from('group_orders')
        .update({
          participants: groupOrder.participants,
          updated_at: new Date().toISOString()
        })
        .eq('id', groupOrderId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as GroupOrder
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Confirm participation in a group order
  async confirmGroupOrderParticipation(
    groupOrderId: string, 
    userId: string
  ): Promise<ApiResponse<GroupOrder>> {
    try {
      // Get the current group order
      const { data: groupOrder, error: fetchError } = await supabase
        .from('group_orders')
        .select('*')
        .eq('id', groupOrderId)
        .single();

      if (fetchError) throw fetchError;

      // Find the participant and update their confirmation status
      const participantIndex = groupOrder.participants.findIndex(
        (p: any) => p.user_id === userId
      );

      if (participantIndex === -1) {
        throw new Error('User is not a participant in this group order');
      }

      groupOrder.participants[participantIndex].has_confirmed = true;

      // Update the group order
      const { data, error } = await supabase
        .from('group_orders')
        .update({
          participants: groupOrder.participants,
          updated_at: new Date().toISOString()
        })
        .eq('id', groupOrderId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as GroupOrder
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Close a group order and place the order
  async closeAndPlaceGroupOrder(
    groupOrderId: string, 
    creatorId: string
  ): Promise<ApiResponse<{ groupOrder: GroupOrder; order: Order }>> {
    try {
      // Get the current group order
      const { data: groupOrder, error: fetchError } = await supabase
        .from('group_orders')
        .select('*')
        .eq('id', groupOrderId)
        .eq('creator_id', creatorId) // Only the creator can close the order
        .single();

      if (fetchError) throw fetchError;

      // Combine all items into a single order
      const allItems: CartItem[] = [];
      groupOrder.participants.forEach((participant: any) => {
        if (participant.items && Array.isArray(participant.items)) {
          allItems.push(...participant.items);
        }
      });

      // Calculate total price
      const totalPrice = allItems.reduce((sum, item) => {
        // Make sure we have access to the price through menuItem
        return sum + ((item.menuItem?.price || 0) * item.quantity);
      }, 0);

      // Create a new order
      const newOrder = {
        user_id: creatorId,
        items: allItems,
        total_price: totalPrice,
        status: 'pending' as OrderStatus,
        payment_status: 'pending' as const,
        group_order_id: groupOrderId,
        special_instructions: `Group order: ${groupOrder.name}`
      };

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert(newOrder)
        .select()
        .single();

      if (orderError) throw orderError;

      // Update the group order status and link to the order
      const { data, error } = await supabase
        .from('group_orders')
        .update({
          status: 'ordered',
          order_id: orderData.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', groupOrderId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: {
          groupOrder: data as GroupOrder,
          order: orderData as Order
        }
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
      const { data, error } = await supabase
        .rpc('create_razorpay_order', {
          amount_in_paise: Math.round(amount * 100),
          order_reference: orderId,
          currency: 'INR'
        });

      if (error) throw error;

      return {
        success: true,
        data: data as PaymentResponse
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Verify Razorpay payment
  async verifyRazorpayPayment(
    paymentId: string, 
    orderId: string, 
    signature: string
  ): Promise<ApiResponse<{ verified: boolean }>> {
    try {
      const { data, error } = await supabase
        .rpc('verify_razorpay_payment', {
          payment_id: paymentId,
          order_id: orderId,
          signature: signature
        });

      if (error) throw error;

      return {
        success: true,
        data: { verified: data }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Update order payment status
  async updatePaymentStatus(
    orderId: string, 
    paymentId: string, 
    status: PaymentStatus
  ): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: status,
          payment_id: paymentId,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

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

// Queue Management Services
export const queueService = {
  // Get current queue status
  async getQueueStatus(): Promise<ApiResponse<QueueStatus>> {
    try {
      const { data: settings, error: settingsError } = await retryRequest<QueueSettings>(() =>
        supabase
          .from('queue_settings')
          .select('*')
          .single()
      );
        
      if (settingsError) {
        console.log('Queue settings not available, using defaults:', settingsError);
        
        return {
          success: true,
          data: {
            currentPosition: 0,
            maxActiveOrders: 10,
            isAcceptingOrders: true,
            estimatedWaitTime: 0,
            nextIntervalTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
            cooldownRemaining: 0
          }
        };
      }
      
      const { data: activeOrders, error: ordersError } = await retryRequest<Order[]>(() =>
        supabase
          .from('orders')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: true })
      );

      if (ordersError) {
        console.error('Error fetching active orders:', ordersError);
        return {
          success: true,
          data: {
            currentPosition: 0,
            maxActiveOrders: settings?.max_active_orders || 10,
            isAcceptingOrders: settings?.is_accepting_orders || true,
            estimatedWaitTime: 0,
            nextIntervalTime: new Date(settings?.last_interval_time ? new Date(settings.last_interval_time).getTime() + (settings.interval_minutes * 60 * 1000) : Date.now() + 10 * 60 * 1000).toISOString(),
            cooldownRemaining: 0
          }
        };
      }

      const currentPosition = activeOrders?.length || 0;
      const isAcceptingOrders = Boolean(settings?.is_accepting_orders) && currentPosition < (settings?.max_active_orders || 10);
      
      const estimatedWaitTime = currentPosition * 10; // 10 minutes per order
      const nextIntervalTime = new Date(settings?.last_interval_time ? new Date(settings.last_interval_time).getTime() + (settings.interval_minutes * 60 * 1000) : Date.now() + 10 * 60 * 1000).toISOString();
      const cooldownRemaining = Math.max(0, (new Date(nextIntervalTime).getTime() - Date.now()) / 1000 / 60);

      return {
        success: true,
        data: {
          currentPosition,
          maxActiveOrders: settings?.max_active_orders || 10,
          isAcceptingOrders,
          estimatedWaitTime,
          nextIntervalTime,
          cooldownRemaining
        }
      };
    } catch (error) {
      console.error('Error in getQueueStatus:', error);
      return {
        success: true,
        data: {
          currentPosition: 0,
          maxActiveOrders: 10,
          isAcceptingOrders: true,
          estimatedWaitTime: 0,
          nextIntervalTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          cooldownRemaining: 0
        }
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
      
      // Get popular items
      const { data: popularItems, error: itemsError } = await supabase
        // Replace RPC with a query since the RPC function might not exist yet
        .from('order_items')
        .select('menu_item_id, menu_item:menu_items(name), quantity, price')
        .gte('created_at', startDateStr)
        .order('quantity', { ascending: false })
        .limit(10);
        
      if (itemsError) throw itemsError;
      
      // Process the popular items
      const processedItems = popularItems ? 
        popularItems.reduce((acc: any[], item: any) => {
          const existingItem = acc.find(i => i.id === item.menu_item_id);
          if (existingItem) {
            existingItem.quantity += item.quantity;
            existingItem.revenue += item.price * item.quantity;
          } else {
            acc.push({
              id: item.menu_item_id,
              name: item.menu_item?.name || 'Unknown Item',
              quantity: item.quantity,
              revenue: item.price * item.quantity
            });
          }
          return acc;
        }, []).slice(0, 5) : [];
      
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
