// User types
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
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Menu item types
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  available: boolean;
  preparation_time: number; // in minutes
  tags: string[];
  ingredients?: string[];
  nutritional_info?: NutritionalInfo;
  rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
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

// Order types
export interface DeliveryAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
}

export interface Order {
  id: string;
  user_id: string;
  items: CartItem[];
  total_price: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: 'cod' | 'razorpay';
  payment_id?: string;
  delivery_address: DeliveryAddress;
  scheduled_for?: string;
  special_instructions?: string;
  created_at: string;
  updated_at: string;
  group_order_id?: string;
  queue_position?: number;
  estimated_ready_time?: string;
  preparation_time?: number;
}

export interface OrderItem {
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  special_instructions?: string;
  selected_options?: MenuItemOption[];
}

export type OrderStatus = 
  | 'pending' 
  | 'accepted' 
  | 'preparing' 
  | 'ready' 
  | 'completed' 
  | 'cancelled';

export type PaymentStatus = 
  | 'pending' 
  | 'paid' 
  | 'failed' 
  | 'refunded';

// Group order types
export interface GroupOrder {
  id: string;
  creator_id: string;
  name: string;
  participants: GroupOrderParticipant[];
  status: 'open' | 'closed' | 'ordered';
  expiry_time: string;
  order_id?: string;
  invitation_link: string;
  created_at: string;
  updated_at: string;
}

export interface GroupOrderParticipant {
  user_id: string;
  name: string;
  items: CartItem[];
  has_confirmed: boolean;
}

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

// Recommendation types
export interface Recommendation {
  menu_item_id: string;
  reason: 'popular' | 'frequently_ordered' | 'based_on_history' | 'seasonal';
  score: number;
}

// Analytics types
export interface OrderAnalytics {
  total_orders: number;
  total_sales: number;
  average_order_value: number;
  popular_items: {
    item_id: string;
    name: string;
    quantity: number;
    revenue: number;
  }[];
  sales_by_time: {
    hour: number;
    orders: number;
    revenue: number;
  }[];
  sales_by_day: {
    day: string;
    orders: number;
    revenue: number;
  }[];
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

// Add Razorpay types
export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
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

// Add Queue Management types
export interface QueueSettings {
  max_active_orders: number;
  is_accepting_orders: boolean;
  cooldown_minutes: number;
  interval_minutes: number;
  next_interval_time: string;
}

export interface QueueStatus {
  currentPosition: number;
  maxActiveOrders: number;
  isAcceptingOrders: boolean;
  estimatedWaitTime: number;
  nextIntervalTime: string;
  cooldownRemaining: number;
  interval_minutes: number;
  next_interval_time: string;
  active_orders_count: number;
  cooldown_end_time: string | null;
}
