import type { User as SupabaseAuthUser } from '@supabase/supabase-js';

// User types
export interface AuthUser {
  id: string;
  email?: string;
  app_metadata: {
    provider?: string;
    [key: string]: any;
  };
  user_metadata: {
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    role?: string;
    [key: string]: any;
  };
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  role: 'customer' | 'shopkeeper' | 'admin';
  created_at: string;
  updated_at: string;
  profile_image_url?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  dietary_restrictions?: string[];
  favorite_cuisines?: string[];
  spice_level?: 'mild' | 'medium' | 'spicy';
  notifications_enabled: boolean;
  order_history_visibility: boolean;
}

// Authentication types
export interface AuthState {
  user: AuthUser | null;
  profile: User | null;
  session: any | null;
  loading: boolean;
  error?: string | null;
}

export interface AuthContextType {
  user: AuthUser | null;
  profile: User | null;
  session: any | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, firstName: string, lastName: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
}

// Menu item types
export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  category_id?: string; // Link to menu category
  is_available: boolean;
  preparation_time: number; // in minutes
  tags: string[];
  ingredients: string[];
  nutritional_info?: NutritionalInfo;
  rating?: number;
  review_count?: number;
  vendor_id?: string; // Add vendor_id to link menu items to vendors
  is_featured?: boolean; // Featured item flag
  inventory_count?: number; // -1 for unlimited, number for limited stock
  low_stock_threshold?: number; // Alert threshold for low stock
  discount_percentage?: number; // Discount percentage
  original_price?: number; // Original price before discount
  created_at?: string;
  updated_at?: string;
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  allergens?: string[];
}

// Cart types
export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
  selected_options?: MenuItemOption[];
}

export interface MenuItemOption {
  id: string;
  name: string;
  price: number;
}

export interface CartState {
  items: CartItem[];
  totalPrice: number;
  totalItems: number;
}

export interface CartContextType {
  items: CartItem[];
  totalPrice: number;
  totalItems: number;
  addItem: (item: MenuItem, quantity: number, specialInstructions?: string, selectedOptions?: MenuItemOption[]) => void;
  removeItem: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  updateItemInstructions: (itemId: string, instructions: string) => void;
  clearCart: () => void;
  getItemById: (itemId: string) => CartItem | undefined;
}

// Order types
export interface DeliveryAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
}

export interface Vendor {
  id: string;
  business_name: string;
  description: string;
  business_type: string;
  address: any;
  phone_number: string;
  vendor_email: string;
  delivery_fee: number;
  minimum_order_amount: number;
  estimated_delivery_time: number;
  is_active: boolean;
  upi_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id: number;
  user_id: string;
  vendor_id?: string;
  status: OrderStatus;
  items: OrderItem[];
  total_price: number;
  created_at: string;
  payment_status?: PaymentStatus;
  payment_method?: 'cod' | 'razorpay';
  payment_id?: string;
  delivery_address?: DeliveryAddress;
  scheduled_for?: string;
  special_instructions?: string;
  updated_at?: string;
  group_order_id?: string;
  queue_position?: number;
  estimated_ready_time?: string;
  preparation_time?: number;
  order_type?: 'delivery' | 'pickup';
  pickup_code?: string;
  estimated_delivery_time?: string;
  delivery_status?: DeliveryStatus;
  delivery_person_id?: string;
  bill_number?: number;
  bill_date?: string;
}

export interface OrderItem {
  menu_item_id?: string;
  menu_item: MenuItem;
  quantity: number;
  special_instructions?: string;
  selected_options?: MenuItemOption[];
}

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded';

export type DeliveryStatus =
  | 'pending'
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'failed';



// Scheduled order types
export interface ScheduledOrder {
  id: string;
  user_id: string;
  order_template: {
    items: CartItem[];
    total_price: number;
  };
  schedule: {
    frequency: 'once' | 'daily' | 'weekly';
    days?: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
    time: string;
    start_date: string;
    end_date?: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Notification types
export type NotificationType = 'order_status' | 'delivery' | 'system' | 'alert' | 'promotion';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: NotificationType;
  read: boolean;
  data?: {
    orderId?: string;
    actionText?: string;
    actionUrl?: string;
    imageUrl?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at?: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Payment types
export interface PaymentDetails {
  order_id: string;
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface PaymentResponse {
  id: string;
  order_id: string;
  amount: number;
  status: PaymentStatus;
  method: string;
  created_at: string;
}

// Razorpay types
export interface RazorpayOptions {
  key: string;
  amount: number;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: {
    [key: string]: string;
  };
  theme?: {
    color: string;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

// Queue types
export interface QueueSettings {
  id: number;
  max_active_orders: number;
  is_accepting_orders: boolean;
  cooldown_minutes: number;
  interval_minutes: number;
  next_interval_time: string;
}

export interface QueueStatus {
  // Primary fields (snake_case)
  id?: number;
  current_position: number;
  max_active_orders: number;
  is_accepting_orders: boolean;
  estimated_wait_time?: number;
  next_interval_time: string;
  cooldown_remaining?: number;
  interval_minutes: number;
  active_orders_count: number;
  cooldown_end_time?: string | null;
  
  // Camel case aliases (for frontend compatibility)
  currentPosition?: number;
  maxActiveOrders?: number;
  isAcceptingOrders?: boolean;
  estimatedWaitTime?: number;
  nextIntervalTime?: string;
  cooldownRemaining?: number;
}
